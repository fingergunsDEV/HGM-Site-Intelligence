'use client';

import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Tag, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Crown, 
  Users, 
  Search, 
  Copy, 
  Info,
  Sliders,
  FileSpreadsheet,
  Cpu,
  Code
} from 'lucide-react';
import { UserAccount, TestUserPermissions } from '@/types/auth';
import { 
  useBetaTesters, 
  addBetaTester, 
  removeBetaTester, 
  updateBetaTesterPermissions,
  SUPER_ADMIN_EMAILS,
  DEFAULT_TESTER_PERMISSIONS 
} from '@/lib/auth-storage';

interface BetaTesterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onSimulateTesterSignIn?: (email: string, name?: string) => void;
}

export function BetaTesterManagerModal({
  isOpen,
  onClose,
  currentUser,
  onSimulateTesterSignIn
}: BetaTesterManagerModalProps) {
  const testers = useBetaTesters();
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Feature toggle state for new test user
  const [allowedCrawls, setAllowedCrawls] = useState<number>(5);
  const [canExport, setCanExport] = useState<boolean>(false);
  const [canUseAdvanced, setCanUseAdvanced] = useState<boolean>(false);
  const [canAccessCodebase, setCanAccessCodebase] = useState<boolean>(false);
  const [canAccessCicd, setCanAccessCicd] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTester = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (SUPER_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === cleanEmail)) {
      setErrorMessage(`This email is already one of the designated Super Admins (${cleanEmail}) and permanently has unrestricted full access.`);
      return;
    }

    const customPermissions: TestUserPermissions = {
      allowedCrawls,
      canExport,
      canUseAdvanced,
      canAccessCodebase,
      canAccessCicd,
      allowSmtpWithoutGcp: false
    };

    try {
      addBetaTester(
        cleanEmail, 
        newName, 
        newNotes, 
        currentUser?.email || SUPER_ADMIN_EMAILS[0],
        customPermissions
      );
      setSuccessMessage(`Added ${cleanEmail} with limited test permissions (${allowedCrawls} crawls${canExport ? ', exports enabled' : ', no exports'}${canUseAdvanced ? ', advanced runs enabled' : ''}).`);
      setNewEmail('');
      setNewName('');
      setNewNotes('');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add test user.');
    }
  };

  const handleTogglePermission = (testerId: string, currentPermissions: TestUserPermissions, key: keyof TestUserPermissions) => {
    const updated = {
      ...currentPermissions,
      [key]: !currentPermissions[key]
    };
    updateBetaTesterPermissions(testerId, updated);
  };

  const handleRemove = (id: string, email: string) => {
    if (confirm(`Revoke test user access for ${email}?`)) {
      removeBetaTester(id);
      setSuccessMessage(`Revoked access for ${email}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCopyInviteInfo = (email: string) => {
    const text = `You've been added to Site Intelligence Platform as an authorized Test User! Sign in with your Google Account (${email}) to access your testing allocation.`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const filteredTesters = testers.filter(t => 
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.name && t.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div 
      id="beta-tester-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative text-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-slate-950 p-5 sm:p-6 text-white border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold font-mono">
              <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              Super Admin Authority
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {SUPER_ADMIN_EMAILS.join(' • ')}
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Test User Permission & Access Manager</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            As a Super Admin, you have access to everything with zero paywalls. You can add test users and configure their specific feature allowances (crawls allowed, export downloads, and advanced features).
          </p>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Feedback Messages */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Add Tester Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-600" />
              <span>Add Test User with Limited Feature Scope</span>
            </h3>

            <form onSubmit={handleAddTester} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="tester@domain.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name or Organization (Optional)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Acme Media QA"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white"
                  />
                </div>
              </div>

              {/* Granular Feature Permissions Matrix */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Granular Feature Permissions:</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Only enabled features will be accessible</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Allowed Crawls */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-700 text-[11px]">Crawl Allowance:</span>
                    <select
                      value={allowedCrawls}
                      onChange={(e) => setAllowedCrawls(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                    >
                      <option value={1}>1 Crawl</option>
                      <option value={3}>3 Crawls</option>
                      <option value={5}>5 Crawls</option>
                      <option value={10}>10 Crawls</option>
                      <option value={25}>25 Crawls</option>
                      <option value={999}>Unlimited</option>
                    </select>
                  </div>

                  {/* Can Export */}
                  <label className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-700 text-[11px] flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      Allow CSV & ZIP Exports
                    </span>
                    <input
                      type="checkbox"
                      checked={canExport}
                      onChange={(e) => setCanExport(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                    />
                  </label>

                  {/* Can Use Advanced Features */}
                  <label className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-700 text-[11px] flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-indigo-600" />
                      Allow Advanced ($3) Runs
                    </span>
                    <input
                      type="checkbox"
                      checked={canUseAdvanced}
                      onChange={(e) => setCanUseAdvanced(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                    />
                  </label>

                  {/* Can Access Codebase */}
                  <label className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-700 text-[11px] flex items-center gap-1">
                      <Code className="w-3 h-3 text-slate-700" />
                      Allow Codebase IDE
                    </span>
                    <input
                      type="checkbox"
                      checked={canAccessCodebase}
                      onChange={(e) => setCanAccessCodebase(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Note / Tag
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Agency audit client - 5 crawls permitted"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>Add Limited Test User</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Testers List */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized Test Users ({testers.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Users configured with specific feature permissions upon Google Sign-In.
                </p>
              </div>

              {testers.length > 2 && (
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search testers..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-slate-50"
                  />
                </div>
              )}
            </div>

            {testers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">No Test Users Added Yet</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                  Add test Google accounts above so they can sign in with Google with limited permissions calibrated by you.
                </p>
              </div>
            ) : filteredTesters.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No testers matching &quot;{searchTerm}&quot;
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTesters.map((tester) => {
                  const perms = tester.permissions || DEFAULT_TESTER_PERMISSIONS;
                  return (
                    <div 
                      key={tester.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {tester.name?.charAt(0).toUpperCase() || tester.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{tester.name || tester.email}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                                Test Account
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 font-mono mt-0.5">{tester.email}</div>
                            {tester.notes && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">{tester.notes}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Copy invite message */}
                          <button
                            type="button"
                            onClick={() => handleCopyInviteInfo(tester.email)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Copy invite announcement for this user"
                          >
                            {copiedEmail === tester.email ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Simulate Sign In */}
                          {onSimulateTesterSignIn && (
                            <button
                              type="button"
                              onClick={() => {
                                onSimulateTesterSignIn(tester.email, tester.name);
                                onClose();
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Simulate Google Sign-In as this test user"
                            >
                              <Sparkles className="w-3 h-3 text-cyan-600" />
                              <span>Test Sign-In</span>
                            </button>
                          )}

                          {/* Revoke */}
                          <button
                            type="button"
                            onClick={() => handleRemove(tester.id, tester.email)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Revoke access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Permissions Row with live toggle chips */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-[10px]">
                        <span className="font-mono text-slate-500">Allowed:</span>
                        
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold">
                          {perms.allowedCrawls >= 999 ? 'Unlimited' : `${perms.allowedCrawls} Crawls`}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleTogglePermission(tester.id, perms, 'canExport')}
                          className={`px-2 py-0.5 rounded-full font-semibold cursor-pointer border transition-colors ${
                            perms.canExport 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Exports: {perms.canExport ? 'Allowed' : 'Locked'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePermission(tester.id, perms, 'canUseAdvanced')}
                          className={`px-2 py-0.5 rounded-full font-semibold cursor-pointer border transition-colors ${
                            perms.canUseAdvanced 
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Adv Features: {perms.canUseAdvanced ? 'Enabled' : 'Disabled'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePermission(tester.id, perms, 'canAccessCodebase')}
                          className={`px-2 py-0.5 rounded-full font-semibold cursor-pointer border transition-colors ${
                            perms.canAccessCodebase 
                              ? 'bg-slate-800 border-slate-700 text-slate-200' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          IDE: {perms.canAccessCodebase ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Super Admin permissions active for {SUPER_ADMIN_EMAILS[0]} & {SUPER_ADMIN_EMAILS[1]}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
