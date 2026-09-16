'use client';

import React, { useState } from 'react';
import { 
  Mail, 
  Server, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  SlidersHorizontal,
  FileText,
  Sparkles,
  ExternalLink,
  Info,
  Cloud,
  Crown
} from 'lucide-react';
import { SmtpConfig, SmtpPreset, PageMetadata, CrawlSummary } from '@/types/site-intelligence';
import { 
  useUserAccount, 
  canUserAccessCredentialedFeatures, 
  connectGoogleCloudAccount, 
  disconnectGoogleCloudAccount, 
  isOwnerUser,
  SUPER_ADMIN_EMAILS 
} from '@/lib/auth-storage';

interface SmtpManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  smtpConfig: SmtpConfig;
  onSaveConfig: (config: SmtpConfig) => void;
  pages: PageMetadata[];
  summary: CrawlSummary;
  selectedPageForReport?: PageMetadata | null;
}

export function SmtpManagerModal({
  isOpen,
  onClose,
  smtpConfig,
  onSaveConfig,
  pages,
  summary,
  selectedPageForReport
}: SmtpManagerModalProps) {
  const currentUser = useUserAccount();
  const isSuperAdmin = isOwnerUser(currentUser);
  const hasGcpAccess = canUserAccessCredentialedFeatures(currentUser);

  const [config, setConfig] = useState<SmtpConfig>(smtpConfig);
  const [activeTab, setActiveTab] = useState<'config' | 'send' | 'alerts' | 'gcp'>('config');
  
  // GCP Account form state
  const [gcpProjectIdInput, setGcpProjectIdInput] = useState(currentUser?.gcpProjectId || 'search-intel-production-2025');
  const [gcpSuccessMsg, setGcpSuccessMsg] = useState<string | null>(null);

  // Test Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  
  // Send Report State
  const [isSending, setIsSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(config.defaultRecipient || '');
  const [customSubject, setCustomSubject] = useState('');
  const [reportMode, setReportMode] = useState<'full-audit' | 'single-page'>('full-audit');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleConnectGcp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gcpProjectIdInput.trim()) return;
    connectGoogleCloudAccount(gcpProjectIdInput.trim());
    setGcpSuccessMsg(`Google Cloud account connected to project: ${gcpProjectIdInput.trim()}`);
    setTimeout(() => setGcpSuccessMsg(null), 3000);
  };

  const handleDisconnectGcp = () => {
    disconnectGoogleCloudAccount();
    setGcpSuccessMsg('Google Cloud account disconnected.');
    setTimeout(() => setGcpSuccessMsg(null), 3000);
  };

  const handleApplyPreset = (preset: SmtpPreset) => {
    if (preset === 'ssl-465') {
      setConfig(prev => ({
        ...prev,
        preset: 'ssl-465',
        host: prev.host === 'mail.yourdomain.com' ? 'smtp.yourdomain.com' : (prev.host || 'smtp.yourdomain.com'),
        port: 465,
        secure: true
      }));
    } else if (preset === 'tls-587') {
      setConfig(prev => ({
        ...prev,
        preset: 'tls-587',
        host: prev.host === 'mail.yourdomain.com' ? 'smtp.yourdomain.com' : (prev.host || 'smtp.yourdomain.com'),
        port: 587,
        secure: false
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        preset: 'custom'
      }));
    }
  };

  const handleTestConnection = async (sendPing: boolean = false) => {
    if (!hasGcpAccess) {
      setActiveTab('gcp');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
          pass: config.pass,
          sendPing,
          recipient: recipientEmail || config.user
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          latencyMs: data.latencyMs
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Connection test failed'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network error attempting SMTP handshake'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendReport = async () => {
    if (!hasGcpAccess) {
      setActiveTab('gcp');
      return;
    }

    if (!recipientEmail.trim()) {
      alert('Please provide a recipient email address.');
      return;
    }

    setIsSending(true);
    setSendResult(null);
    try {
      const targetSingle = reportMode === 'single-page' ? (selectedPageForReport || pages[0]) : undefined;
      const res = await fetch('/api/smtp/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: config,
          recipient: recipientEmail.trim(),
          subject: customSubject.trim() || undefined,
          reportType: reportMode,
          pages: reportMode === 'full-audit' ? pages : undefined,
          singlePage: targetSingle,
          summary
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({
          success: true,
          message: data.message
        });
      } else {
        setSendResult({
          success: false,
          message: data.message || 'Failed to dispatch report email'
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err?.message || 'Failed to communicate with SMTP relay service'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAndClose = () => {
    onSaveConfig(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  SMTP Integration & Email Alerts
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect your custom SMTP mail relay to send automated SEO reports & crawl alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-200 bg-slate-50 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 py-3 px-3.5 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-cyan-600 text-cyan-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>SMTP Server Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-2 py-3 px-3.5 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'border-cyan-600 text-cyan-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Dispatch Audit Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 py-3 px-3.5 font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-cyan-600 text-cyan-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Automation Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gcp')}
            className={`flex items-center gap-2 py-3 px-3.5 font-semibold border-b-2 transition-all cursor-pointer ml-auto ${
              activeTab === 'gcp'
                ? 'border-cyan-600 text-cyan-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className={`w-4 h-4 ${hasGcpAccess ? 'text-emerald-600' : 'text-amber-500'}`} />
            <span>GCP Account {hasGcpAccess ? '✓' : '(Required)'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* GCP Requirement Banner */}
          {isSuperAdmin ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-600 shrink-0" />
                <span className="font-semibold">
                  Super Admin Authority ({currentUser?.email}): Unrestricted access to credentialed SMTP relay enabled without external GCP connection requirements.
                </span>
              </div>
            </div>
          ) : !hasGcpAccess ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Google Cloud Account Connection Required</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                SMTP and other credentialed features only work when you connect your own Google Cloud account to manage outbound relay permissions and identity tokens.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('gcp')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Connect Google Cloud Account Now</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Google Cloud Account Connected: <span className="font-mono">{currentUser?.gcpProjectId || 'Active'}</span>
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-mono">Credentialed Features Active</span>
            </div>
          )}

          {/* TAB: GCP Connection */}
          {activeTab === 'gcp' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Google Cloud Account Integration
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      To prevent abuse and protect email deliverability, custom SMTP relay, API endpoints, and other credentialed features require you to connect your organization&apos;s Google Cloud Platform (GCP) project.
                    </p>
                  </div>
                </div>

                {gcpSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{gcpSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleConnectGcp} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GCP Project ID or Google Service Account Identifier:
                    </label>
                    <input
                      type="text"
                      required
                      value={gcpProjectIdInput}
                      onChange={(e) => setGcpProjectIdInput(e.target.value)}
                      placeholder="e.g. search-intel-enterprise-2025"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Your GCP project token provides identity verification and OAuth2 token authorization.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>{currentUser?.gcpConnected ? 'Update GCP Project' : 'Connect Google Cloud Account'}</span>
                    </button>

                    {currentUser?.gcpConnected && (
                      <button
                        type="button"
                        onClick={handleDisconnectGcp}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Disconnect GCP
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 1: SMTP Server Config */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  SMTP Server Configuration Preset:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ssl-465')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      config.preset === 'ssl-465'
                        ? 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">Standard SSL</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Port 465 (SMTPS)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('tls-587')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      config.preset === 'tls-587'
                        ? 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">Standard TLS</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Port 587 (STARTTLS)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('custom')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      config.preset === 'custom'
                        ? 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">Custom Relay</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Any SMTP host</div>
                  </button>
                </div>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SMTP Host / Server:</label>
                  <input
                    type="text"
                    placeholder="mail.holisticgrowthmarketing.com"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Port:</label>
                  <input
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 465 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SMTP Username / Email:</label>
                  <input
                    type="text"
                    placeholder="admin@yourdomain.com"
                    value={config.user}
                    onChange={(e) => setConfig({ ...config, user: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SMTP Password:</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={config.pass}
                    onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Sender Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">From Name:</label>
                  <input
                    type="text"
                    placeholder="Site Intelligence Auditor"
                    value={config.fromName}
                    onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">From Email:</label>
                  <input
                    type="email"
                    placeholder="audit@yourdomain.com"
                    value={config.fromEmail}
                    onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Secure toggle */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.secure}
                    onChange={(e) => setConfig({ ...config, secure: e.target.checked })}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Use SSL/TLS encryption (Required for port 465)
                  </span>
                </label>
              </div>

              {/* Test Connection Action */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Verify DNS handshake and credentials against host.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTesting || !hasGcpAccess}
                    onClick={() => handleTestConnection(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Test SMTP Handshake</span>
                  </button>
                  <button
                    type="button"
                    disabled={isTesting || !hasGcpAccess}
                    onClick={() => handleTestConnection(true)}
                    className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Send Ping Email</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? 'Connection Verified' : 'Handshake Failed'}</div>
                    <div className="text-[11px] opacity-90">{testResult.message}</div>
                    {testResult.latencyMs && (
                      <div className="text-[10px] font-mono mt-1 opacity-75">
                        Latency: {testResult.latencyMs}ms
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Dispatch Audit Report */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Recipient Email Address:</label>
                <input
                  type="email"
                  placeholder="stakeholder@domain.com, client@agency.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Subject (Optional override):</label>
                <input
                  type="text"
                  placeholder="Site Intelligence Executive SEO Audit Report"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Report Scope:</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                    reportMode === 'full-audit' ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-500' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="reportMode"
                      checked={reportMode === 'full-audit'}
                      onChange={() => setReportMode('full-audit')}
                      className="text-cyan-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Complete Crawl Audit</div>
                      <div className="text-[10px] text-slate-500">All {pages.length} pages + overall health score</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                    reportMode === 'single-page' ? 'border-cyan-600 bg-cyan-50/60 ring-1 ring-cyan-500' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="reportMode"
                      checked={reportMode === 'single-page'}
                      onChange={() => setReportMode('single-page')}
                      className="text-cyan-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Single Page Remediation</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                        {selectedPageForReport?.url || pages[0]?.url || 'Target Page'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Email Delivery Details:</div>
                <p>• Formatted HTML executive summary with responsive metrics cards.</p>
                <p>• Color-coded issue priority matrix (Blocker, Critical, Warning, Notice).</p>
                <p>• Schema microdata validation overview & recommended action items.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSending || pages.length === 0 || !hasGcpAccess}
                  onClick={handleSendReport}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isSending ? 'Dispatching...' : 'Send Audit Report Email'}</span>
                </button>
              </div>

              {sendResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
                  sendResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {sendResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{sendResult.success ? 'Email Dispatched' : 'Dispatch Failed'}</div>
                    <div className="text-[11px] opacity-90">{sendResult.message}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Automation Rules */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">
                      Auto-Send Report on Crawl Completion
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dispatches the full executive audit to the default recipient whenever a site crawl finishes.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoSendAfterCrawl}
                    onChange={(e) => setConfig({ ...config, autoSendAfterCrawl: e.target.checked })}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">
                      Alert on Critical SEO Vulnerabilities Only
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Suppress email notifications unless 1 or more critical blocker errors are detected.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.alertOnCriticalOnly}
                    onChange={(e) => setConfig({ ...config, alertOnCriticalOnly: e.target.checked })}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Default Notification Email:</label>
                <input
                  type="email"
                  placeholder="admin@yourdomain.com"
                  value={config.defaultRecipient}
                  onChange={(e) => setConfig({ ...config, defaultRecipient: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            Relay: {config.host}:{config.port} ({config.secure ? 'SSL' : 'TLS'})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
