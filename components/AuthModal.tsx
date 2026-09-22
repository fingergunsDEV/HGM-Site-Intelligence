'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Star,
  Crown,
  Check,
  ChevronRight,
  Plus
} from 'lucide-react';
import { UserAccount } from '@/types/auth';
import { 
  createAccount, 
  signInWithGoogle, 
  OWNER_EMAIL, 
  useBetaTesters, 
  isEmailInvitedBetaTester 
} from '@/lib/auth-storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'signup' | 'signin';
  titlePrompt?: string;
  defaultToGoogle?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
  titlePrompt,
  defaultToGoogle = false
}: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);
  const [showGoogleChooser, setShowGoogleChooser] = useState(defaultToGoogle);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Email form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active beta testers reactive list
  const allBetaTesters = useBetaTesters();
  const testers = allBetaTesters.filter(t => t.status === 'active');

  if (!isOpen) return null;

  // Google Sign-In Handler
  const handleGoogleSelect = (selectedEmail: string, selectedName?: string) => {
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const user = signInWithGoogle({
          email: selectedEmail,
          name: selectedName || (selectedEmail.toLowerCase() === OWNER_EMAIL.toLowerCase() ? 'Jason (Owner)' : selectedEmail.split('@')[0])
        });
        setIsLoading(false);
        onSuccess(user);
        onClose();
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Google authentication failed.');
      }
    }, 450);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail || !customGoogleEmail.includes('@') || !customGoogleEmail.includes('.')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    handleGoogleSelect(customGoogleEmail, customGoogleName);
  };

  // Standard Email/Password Form Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const user = createAccount(name || email.split('@')[0], email);
        setIsLoading(false);
        onSuccess(user);
        onClose();
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Failed to authenticate.');
      }
    }, 400);
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202124]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="auth-modal-container"
        className="bg-white rounded-lg border border-[#dadce0] shadow-xl w-full max-w-md overflow-hidden flex flex-col relative max-h-[92vh]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-md text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Visual Banner */}
        <div className="bg-white p-5 sm:p-6 border-b border-[#dadce0]">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] mb-2">
            <Zap className="w-3 h-3" />
            <span>Google Auth & Access Control</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-[#202124]">
            {showGoogleChooser 
              ? 'Sign in with Google' 
              : mode === 'signup' 
              ? 'Create Your Account' 
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#5f6368] mt-1 leading-relaxed">
            {titlePrompt || (showGoogleChooser
              ? 'Select your Google Account to sign in. Owner and authorized beta testers bypass all paywalls with unlimited access.'
              : mode === 'signup' 
              ? 'Sign up to unlock your 1 Free Live Crawler test with complete technical SEO auditing.'
              : 'Sign in to access your crawler history, manage site schemas, or upgrade to Pro ($20/mo).')}
          </p>

          {/* Quick Notice Banner */}
          <div className="mt-3 p-2.5 bg-[#f8fafd] rounded-md border border-[#dadce0] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#b06000]" />
              <span className="text-[11px] text-[#3c4043]">
                <strong className="text-[#202124]">jason@holisticgrowthmarketing.com</strong> unlocks all features
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] text-xs font-medium">
              {error}
            </div>
          )}

          {/* GOOGLE ACCOUNT CHOOSER VIEW */}
          {showGoogleChooser ? (
            <div className="space-y-3">
              <div className="text-xs font-medium text-[#202124] mb-1 flex items-center justify-between">
                <span>Choose a Google Account:</span>
                <button
                  type="button"
                  onClick={() => setShowGoogleChooser(false)}
                  className="text-[11px] text-[#1a73e8] hover:underline font-medium cursor-pointer"
                >
                  Use email instead
                </button>
              </div>

              {/* Account 1: Owner Jason */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleGoogleSelect(OWNER_EMAIL, 'Jason (Owner)')}
                className="w-full text-left p-3.5 rounded-md border border-[#d2e3fc] bg-[#e8f0fe]/40 hover:bg-[#e8f0fe] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-medium text-xs shrink-0">
                    J
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#202124]">Jason (Platform Owner)</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#fef7e0] text-[#b06000] border border-[#fce8b2] text-[10px] font-medium">
                        SuperAdmin VIP
                      </span>
                    </div>
                    <div className="text-[11px] text-[#1a73e8] font-mono">{OWNER_EMAIL}</div>
                    <div className="text-[10px] text-[#137333] font-medium mt-0.5">
                      ✓ All Features Unlocked • Paywalls Disabled • Invite Testers
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#1a73e8] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Invited Beta Testers (if any) */}
              {testers.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-[#5f6368] font-mono">
                    Authorized Early Adopter Beta Testers
                  </div>
                  {testers.map((t) => (
                    <button
                      key={t.email}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleGoogleSelect(t.email, t.name)}
                      className="w-full text-left p-3 rounded-md border border-[#ceead6] bg-[#e6f4ea]/30 hover:bg-[#e6f4ea]/60 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#137333] text-white flex items-center justify-center font-medium text-xs shrink-0">
                          {t.name?.charAt(0).toUpperCase() || t.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#202124]">{t.name || t.email}</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#ceead6] text-[#137333] text-[10px] font-medium font-mono">
                              Beta Tester
                            </span>
                          </div>
                          <div className="text-[11px] text-[#5f6368] font-mono">{t.email}</div>
                          <div className="text-[10px] text-[#137333] font-medium">
                            ✓ All features unlocked & paywalls disabled
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#137333] group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Option to enter custom Google Account */}
              {!showCustomGoogleInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full py-2.5 px-3 rounded-md border border-dashed border-[#dadce0] hover:border-[#1a73e8] bg-[#f8fafd] hover:bg-white text-[#3c4043] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1a73e8]" />
                  <span>Sign in with another Google Account</span>
                </button>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="p-3.5 rounded-md border border-[#dadce0] bg-[#f8fafd] space-y-3 animate-in fade-in">
                  <div className="text-xs font-semibold text-[#202124]">
                    Enter Google Account Details
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#5f6368] mb-1">
                      Google Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="username@gmail.com or @yourdomain.com"
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#5f6368] mb-1">
                      Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogleInput(false)}
                      className="text-xs text-[#5f6368] hover:text-[#202124]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Signing in...' : 'Sign In with Google'}
                    </button>
                  </div>
                </form>
              )}

              {/* Help text */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-[#5f6368]">
                  Signing in with Google provides secure instant authentication with no passwords required.
                </p>
              </div>
            </div>
          ) : (
            /* STANDARD VIEW (GOOGLE BUTTON + EMAIL FORM) */
            <div className="space-y-4">
              {/* Primary Google Sign In Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowGoogleChooser(true)}
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-white hover:bg-[#f8fafd] text-[#3c4043] border border-[#dadce0] hover:border-[#1a73e8] rounded-md text-xs font-medium shadow-2xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-[#dadce0] w-full"></div>
                <span className="bg-white px-3 text-[11px] text-[#5f6368] font-medium uppercase font-mono">
                  or with email
                </span>
                <div className="border-t border-[#dadce0] w-full"></div>
              </div>

              {/* Mode Switcher */}
              <div className="flex p-0.5 bg-[#f1f3f4] rounded-md mb-4 border border-[#dadce0]">
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                    mode === 'signup' 
                      ? 'bg-white text-[#1a73e8] shadow-2xs font-semibold' 
                      : 'text-[#5f6368] hover:text-[#202124]'
                  }`}
                >
                  Create Account (Free)
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                    mode === 'signin' 
                      ? 'bg-white text-[#1a73e8] shadow-2xs font-semibold' 
                      : 'text-[#5f6368] hover:text-[#202124]'
                  }`}
                >
                  Sign In
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-[#3c4043] mb-1">
                      Full Name or Organization
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#5f6368] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] bg-white text-[#202124]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#3c4043] mb-1">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5f6368] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] bg-white text-[#202124]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3c4043] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5f6368] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] bg-white text-[#202124]"
                    />
                  </div>
                  <p className="text-[10px] text-[#5f6368] mt-1">Minimum 6 characters.</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : mode === 'signup' ? (
                    <>
                      <span>Create Account & Start 1 Free Crawl</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Sign In & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Guarantee Note */}
              <div className="mt-4 pt-4 border-t border-[#dadce0] flex items-center justify-between text-[11px] text-[#5f6368]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#137333]" />
                  No credit card required for 1st test
                </span>
                <span className="font-medium text-[#1a73e8]">
                  Pro is $20/month
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
