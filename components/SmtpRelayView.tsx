'use client';

import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Server, 
  Zap, 
  Sliders, 
  Lock, 
  Clock, 
  Check, 
  FileText,
  Radio
} from 'lucide-react';
import { SmtpConfig, SmtpPreset, PageMetadata, CrawlSummary } from '@/types/site-intelligence';

interface SmtpRelayViewProps {
  smtpConfig: SmtpConfig;
  onSaveConfig: (config: SmtpConfig) => void;
  pages: PageMetadata[];
  summary: CrawlSummary;
}

export function SmtpRelayView({
  smtpConfig,
  onSaveConfig,
  pages,
  summary
}: SmtpRelayViewProps) {
  const [config, setConfig] = useState<SmtpConfig>(smtpConfig);
  const [testRecipient, setTestRecipient] = useState(smtpConfig.defaultRecipient || 'jgibsonwebdesign@gmail.com');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    ping?: any;
  } | null>(null);

  const [isSendingReport, setIsSendingReport] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleApplyPreset = (preset: SmtpPreset) => {
    if (preset === 'ssl-465') {
      setConfig(prev => ({
        ...prev,
        preset: 'ssl-465',
        host: prev.host || 'smtp.yourdomain.com',
        port: 465,
        secure: true
      }));
    } else if (preset === 'tls-587') {
      setConfig(prev => ({
        ...prev,
        preset: 'tls-587',
        host: prev.host || 'smtp.yourdomain.com',
        port: 587,
        secure: false
      }));
    } else {
      setConfig(prev => ({ ...prev, preset: 'custom' }));
    }
  };

  const handleSave = () => {
    onSaveConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async (withPing = false) => {
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
          sendPing: withPing,
          recipient: testRecipient
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error testing SMTP connection.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendFullReport = async () => {
    setIsSendingReport(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/smtp/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: config,
          recipient: testRecipient,
          pages: pages,
          summary: summary,
          reportType: 'full-audit'
        })
      });
      const data = await res.json();
      setSendResult(data);
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || 'Failed to dispatch email report.'
      });
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enterprise Email Relay & Alert Infrastructure</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              SMTP Relay & Audit Dispatch Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Connect any standard mail server, cloud relay, or custom SMTP host to transmit real-time crawl completion notifications, executive SEO audit reports, and critical schema regression alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Config Saved!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Server Configuration */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>SMTP Mail Server Configuration</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">RFC 5321 Compliant</span>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-mono uppercase">
                Server Presets:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ssl-465')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    config.preset === 'ssl-465'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">Standard SSL</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Port 465 (SMTPS)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('tls-587')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    config.preset === 'tls-587'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">Standard TLS</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Port 587 (STARTTLS)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('custom')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    config.preset === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">Custom Host</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Manual settings</div>
                </button>
              </div>
            </div>

            {/* Host & Port */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">SMTP Host / Server</label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value, preset: 'custom' })}
                  placeholder="smtp.yourdomain.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Port</label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: Number(e.target.value) || 465, preset: 'custom' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Auth Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">SMTP Username / Email</label>
                <input
                  type="text"
                  value={config.user}
                  onChange={(e) => setConfig({ ...config, user: e.target.value })}
                  placeholder="admin@yourdomain.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">SMTP Password</label>
                <input
                  type="password"
                  value={config.pass}
                  onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Sender & Recipient defaults */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">From Name</label>
                <input
                  type="text"
                  value={config.fromName}
                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                  placeholder="Site Intelligence Platform"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Default Recipient</label>
                <input
                  type="email"
                  value={config.defaultRecipient}
                  onChange={(e) => {
                    setConfig({ ...config, defaultRecipient: e.target.value });
                    setTestRecipient(e.target.value);
                  }}
                  placeholder="jgibsonwebdesign@gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Security Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-800">SSL / TLS Connection Encryption</div>
                <div className="text-[11px] text-slate-500">Require SSL/TLS socket handshake</div>
              </div>
              <input
                type="checkbox"
                checked={config.secure}
                onChange={(e) => setConfig({ ...config, secure: e.target.checked, preset: 'custom' })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Automation Rules */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Automated Dispatch Rules</span>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSendAfterCrawl}
                  onChange={(e) => setConfig({ ...config, autoSendAfterCrawl: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-800">
                    Dispatch Executive SEO Summary upon Crawl Completion
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Automatically emails an executive HTML report whenever a live crawl finishes.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.alertOnCriticalOnly}
                  onChange={(e) => setConfig({ ...config, alertOnCriticalOnly: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-800">
                    Alert on Critical Audit Failures Only
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Suppresses routine completion emails if no critical defects (4xx/5xx, missing titles/H1s) exist.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Live Testing & Direct Report Dispatch */}
        <div className="lg:col-span-5 space-y-5">
          {/* Connection Test Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Live Connection Verification</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Verify socket connectivity, TLS certificate negotiation, and SMTP authentication credentials with your mail server.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Test Ping Recipient</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestConnection(false)}
                disabled={isTesting || !config.host}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5 text-slate-600" />}
                <span>Socket Handshake</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestConnection(true)}
                disabled={isTesting || !config.host || !testRecipient}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-indigo-600" />}
                <span>Send Test Ping</span>
              </button>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.success ? 'SMTP Connection Verified' : 'Authentication Failed'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                {testResult.latencyMs && (
                  <div className="text-[10px] font-mono text-emerald-700 pt-1">
                    Latency: {testResult.latencyMs}ms | Host: {config.host}:{config.port}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dispatch Full Audit Report */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Dispatch Crawl Audit Report</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Sends an executive HTML email report with health score gauges, issue severity counts, and individual URL schema status to the designated recipient.
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Current Crawled Pages:</span>
                <span className="font-bold text-slate-800">{pages.length}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Critical Issues:</span>
                <span className="font-bold text-rose-600">{summary.criticalIssuesCount}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Schemas Synthesized:</span>
                <span className="font-bold text-emerald-600">{summary.schemasGeneratedCount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendFullReport}
              disabled={isSendingReport || pages.length === 0 || !config.host}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-slate-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSendingReport ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Dispatching Report via Relay...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Send Full Audit Report Now</span>
                </>
              )}
            </button>

            {sendResult && (
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                sendResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {sendResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{sendResult.success ? 'Report Dispatched Successfully' : 'Dispatch Failed'}</span>
                </div>
                <p className="text-[11px]">{sendResult.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
