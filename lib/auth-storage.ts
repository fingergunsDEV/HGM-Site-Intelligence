import { useSyncExternalStore } from 'react';
import { UserAccount, BetaTesterInvite, TestUserPermissions } from '@/types/auth';

// Both jgibsonwebdesign@gmail.com and jason@holisticgrowthmarketing.com are Super Admins with full access & no paywalls
export const SUPER_ADMIN_EMAILS: string[] = [
  'jgibsonwebdesign@gmail.com',
  'jason@holisticgrowthmarketing.com'
];
export const OWNER_EMAIL = 'jgibsonwebdesign@gmail.com';

const STORAGE_KEY = 'site_intelligence_user_session';
const USERS_DB_KEY = 'site_intelligence_registered_users';
const BETA_TESTERS_KEY = 'site_intelligence_beta_testers';

export const DEFAULT_TESTER_PERMISSIONS: TestUserPermissions = {
  allowedCrawls: 5,
  canExport: false,
  canUseAdvanced: false,
  canAccessCodebase: false,
  canAccessCicd: false,
  allowSmtpWithoutGcp: false
};

let userListeners: Array<() => void> = [];
let betaListeners: Array<() => void> = [];

export function subscribeUser(callback: () => void) {
  userListeners.push(callback);
  return () => {
    userListeners = userListeners.filter(l => l !== callback);
  };
}

function notifyUserChanged() {
  userListeners.forEach(l => {
    try {
      l();
    } catch {}
  });
}

export function subscribeBetaTesters(callback: () => void) {
  betaListeners.push(callback);
  return () => {
    betaListeners = betaListeners.filter(l => l !== callback);
  };
}

function notifyBetaTestersChanged() {
  betaListeners.forEach(l => {
    try {
      l();
    } catch {}
  });
}

// Beta Testers Management with Cached Snapshot
const SERVER_EMPTY_TESTERS: BetaTesterInvite[] = [];

let cachedBetaTestersRaw: string | null | undefined = undefined;
let cachedBetaTestersList: BetaTesterInvite[] = SERVER_EMPTY_TESTERS;

export function getBetaTestersSnapshot(): BetaTesterInvite[] {
  if (typeof window === 'undefined') return SERVER_EMPTY_TESTERS;
  try {
    const raw = localStorage.getItem(BETA_TESTERS_KEY);
    if (raw !== cachedBetaTestersRaw) {
      cachedBetaTestersRaw = raw;
      if (!raw) {
        cachedBetaTestersList = SERVER_EMPTY_TESTERS;
      } else {
        const parsed = JSON.parse(raw);
        cachedBetaTestersList = Array.isArray(parsed) ? parsed : SERVER_EMPTY_TESTERS;
      }
    }
    return cachedBetaTestersList;
  } catch {
    return SERVER_EMPTY_TESTERS;
  }
}

export function getServerBetaTestersSnapshot(): BetaTesterInvite[] {
  return SERVER_EMPTY_TESTERS;
}

export function getBetaTesters(): BetaTesterInvite[] {
  return getBetaTestersSnapshot();
}

export function isEmailInvitedBetaTester(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const testers = getBetaTesters();
  return testers.some(t => t.email.toLowerCase() === cleanEmail && t.status === 'active');
}

export function getInviteForEmail(email: string): BetaTesterInvite | undefined {
  if (!email) return undefined;
  const cleanEmail = email.trim().toLowerCase();
  const testers = getBetaTesters();
  return testers.find(t => t.email.toLowerCase() === cleanEmail && t.status === 'active');
}

export function isOwnerEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === clean);
}

export function addBetaTester(
  email: string, 
  name?: string, 
  notes?: string, 
  invitedBy: string = OWNER_EMAIL,
  permissions?: Partial<TestUserPermissions>
): BetaTesterInvite {
  const cleanEmail = email.trim().toLowerCase();
  const testers = getBetaTesters();
  
  const mergedPermissions: TestUserPermissions = {
    ...DEFAULT_TESTER_PERMISSIONS,
    ...permissions
  };

  // Check if already exists
  const existingIndex = testers.findIndex(t => t.email.toLowerCase() === cleanEmail);
  const now = new Date().toISOString();
  
  let newTester: BetaTesterInvite;
  if (existingIndex >= 0) {
    newTester = {
      ...testers[existingIndex],
      status: 'active',
      name: name?.trim() || testers[existingIndex].name || cleanEmail.split('@')[0],
      notes: notes?.trim() || testers[existingIndex].notes || 'Configured Test User',
      permissions: mergedPermissions,
      invitedAt: now
    };
    testers[existingIndex] = newTester;
  } else {
    newTester = {
      id: `beta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      invitedBy,
      invitedAt: now,
      notes: notes?.trim() || 'Configured Test User',
      status: 'active',
      permissions: mergedPermissions
    };
    testers.unshift(newTester);
  }

  if (typeof window !== 'undefined') {
    const json = JSON.stringify(testers);
    localStorage.setItem(BETA_TESTERS_KEY, json);
    cachedBetaTestersRaw = json;
    cachedBetaTestersList = testers;
  }
  notifyBetaTestersChanged();

  // If a registered user with this email exists, sync their test permissions immediately
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      const users: Record<string, UserAccount> = usersRaw ? JSON.parse(usersRaw) : {};
      if (users[cleanEmail]) {
        users[cleanEmail] = {
          ...users[cleanEmail],
          tier: 'beta',
          role: 'beta_tester',
          isBetaTester: true,
          testPermissions: mergedPermissions,
          subscriptionPrice: `Test User (${mergedPermissions.allowedCrawls} crawls allowed)`
        };
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

        const currentUser = getStoredUser();
        if (currentUser && currentUser.email.toLowerCase() === cleanEmail) {
          saveStoredUser(users[cleanEmail]);
        }
      }
    } catch {}
  }

  return newTester;
}

export function updateBetaTesterPermissions(idOrEmail: string, permissions: Partial<TestUserPermissions>): void {
  const clean = idOrEmail.trim().toLowerCase();
  const testers = getBetaTesters();
  const index = testers.findIndex(t => t.id === idOrEmail || t.email.toLowerCase() === clean);
  if (index === -1) return;

  testers[index] = {
    ...testers[index],
    permissions: {
      ...DEFAULT_TESTER_PERMISSIONS,
      ...testers[index].permissions,
      ...permissions
    }
  };

  if (typeof window !== 'undefined') {
    const json = JSON.stringify(testers);
    localStorage.setItem(BETA_TESTERS_KEY, json);
    cachedBetaTestersRaw = json;
    cachedBetaTestersList = testers;
  }
  notifyBetaTestersChanged();

  // Sync to registered user
  const email = testers[index].email.toLowerCase();
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      const users: Record<string, UserAccount> = usersRaw ? JSON.parse(usersRaw) : {};
      if (users[email]) {
        users[email].testPermissions = testers[index].permissions;
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        const currentUser = getStoredUser();
        if (currentUser && currentUser.email.toLowerCase() === email) {
          saveStoredUser(users[email]);
        }
      }
    } catch {}
  }
}

export function removeBetaTester(idOrEmail: string): void {
  const clean = idOrEmail.trim().toLowerCase();
  const testers = getBetaTesters();
  const filtered = testers.filter(t => t.id !== idOrEmail && t.email.toLowerCase() !== clean);
  
  if (typeof window !== 'undefined') {
    const json = JSON.stringify(filtered);
    localStorage.setItem(BETA_TESTERS_KEY, json);
    cachedBetaTestersRaw = json;
    cachedBetaTestersList = filtered;
  }
  notifyBetaTestersChanged();
}

export function useBetaTesters(): BetaTesterInvite[] {
  return useSyncExternalStore(
    subscribeBetaTesters,
    getBetaTestersSnapshot,
    getServerBetaTestersSnapshot
  );
}

// Check if user is one of the designated Super Admins (jgibsonwebdesign@gmail.com, jason@holisticgrowthmarketing.com)
export function isOwnerUser(user: UserAccount | null): boolean {
  if (!user) return false;
  const cleanEmail = user.email.trim().toLowerCase();
  return isOwnerEmail(cleanEmail) || user.isOwner === true || user.role === 'owner' || user.role === 'superadmin';
}

export function isBetaTesterUser(user: UserAccount | null): boolean {
  if (!user) return false;
  if (isOwnerUser(user)) return false; // Super Admins take precedence
  return user.isBetaTester === true || user.tier === 'beta' || user.role === 'beta_tester' || isEmailInvitedBetaTester(user.email);
}

// General unlocked feature check (Super Admins, Pro, or Active balance)
export function isUserFeatureUnlocked(user: UserAccount | null): boolean {
  if (!user) return false;
  if (isOwnerUser(user)) return true;
  if (user.tier === 'pro' || user.tier === 'superadmin') return true;
  if (user.isBetaTester) return true;
  if ((user.balance || 0) > 0) return true;
  return false;
}

// -------------------------------------------------------------
// NEW PRICING ENGINE CHECKS ($1/crawl, $3/adv run, 1 free crawl)
// -------------------------------------------------------------

export function canUserRunCrawl(user: UserAccount | null): { 
  allowed: boolean; 
  isFree: boolean; 
  cost: number; 
  reason?: string; 
  requiresPayment?: boolean 
} {
  // Super Admin: always allowed, zero cost
  if (isOwnerUser(user)) {
    return { allowed: true, isFree: true, cost: 0 };
  }

  // Test User: checked against allowedCrawls limit
  if (isBetaTesterUser(user)) {
    const maxAllowed = user?.testPermissions?.allowedCrawls ?? 5;
    const used = user?.crawlsUsed || 0;
    if (used < maxAllowed) {
      return { allowed: true, isFree: true, cost: 0 };
    }
    return { 
      allowed: false, 
      isFree: false, 
      cost: 1, 
      reason: `Test account crawl allowance reached (${used}/${maxAllowed} used). Contact a Super Admin to adjust your limit.`, 
      requiresPayment: true 
    };
  }

  // 1 Free Crawl for all users (even unauthenticated guests)
  const crawlsUsed = user?.crawlsUsed || 0;
  if (crawlsUsed < 1) {
    return { allowed: true, isFree: true, cost: 0 };
  }

  // Subsequent crawls cost $1/crawl
  const currentBalance = user?.balance || 0;
  if (currentBalance >= 1) {
    return { allowed: true, isFree: false, cost: 1 };
  }

  return { 
    allowed: false, 
    isFree: false, 
    cost: 1, 
    reason: 'Your 1 free crawl has been completed. Subsequent crawls cost $1 each. Please add credit balance to run this crawl.', 
    requiresPayment: true 
  };
}

export function recordAndDeductCrawlUsage(targetUser?: UserAccount | null): {
  user: UserAccount | null;
  deducted: number;
  remainingBalance: number;
  crawlsRunCount: number;
} {
  const user = targetUser !== undefined ? targetUser : getStoredUser();
  if (!user) {
    return { user: null, deducted: 0, remainingBalance: 0, crawlsRunCount: 0 };
  }

  const currentCrawls = user.crawlsRunCount ?? user.crawlsUsed ?? 0;

  if (isOwnerUser(user)) {
    const updated: UserAccount = {
      ...user,
      crawlsRunCount: currentCrawls + 1,
      crawlsUsed: currentCrawls + 1
    };
    saveStoredUser(updated);
    return {
      user: updated,
      deducted: 0,
      remainingBalance: updated.balance ?? 9999,
      crawlsRunCount: updated.crawlsRunCount ?? (currentCrawls + 1)
    };
  }

  const check = canUserRunCrawl(user);
  let deducted = 0;
  let newBalance = user.balance || 0;

  if (!check.isFree && check.cost > 0) {
    deducted = Math.min(newBalance, check.cost);
    newBalance = Math.max(0, Number((newBalance - deducted).toFixed(2)));
  }

  const updated: UserAccount = {
    ...user,
    crawlsRunCount: currentCrawls + 1,
    crawlsUsed: currentCrawls + 1,
    balance: newBalance
  };
  saveStoredUser(updated);
  return {
    user: updated,
    deducted,
    remainingBalance: newBalance,
    crawlsRunCount: updated.crawlsRunCount ?? (currentCrawls + 1)
  };
}

export function canUserRunAdvancedFeature(user: UserAccount | null, featureName: string = 'Advanced Feature'): { 
  allowed: boolean; 
  cost: number; 
  reason?: string; 
  requiresPayment?: boolean 
} {
  // Super Admin: unlimited, zero cost
  if (isOwnerUser(user)) {
    return { allowed: true, cost: 0 };
  }

  // Test User: checked against specific permission toggle
  if (isBetaTesterUser(user)) {
    if (user?.testPermissions?.canUseAdvanced) {
      return { allowed: true, cost: 0 };
    }
    return { 
      allowed: false, 
      cost: 3, 
      reason: `${featureName} is disabled for your test user account. Ask a Super Admin to enable Advanced Features for your email.`, 
      requiresPayment: true 
    };
  }

  // Regular user / Pro user
  if (!user) {
    return { 
      allowed: false, 
      cost: 3, 
      reason: `${featureName} is an Advanced Feature ($3/run). Please sign in and add credit balance.`, 
      requiresPayment: true 
    };
  }

  if (user.tier === 'pro') {
    return { allowed: true, cost: 0 };
  }

  const currentBalance = user.balance || 0;
  if (currentBalance >= 3) {
    return { allowed: true, cost: 3 };
  }

  return { 
    allowed: false, 
    cost: 3, 
    reason: `${featureName} costs $3 per run. Current balance: $${currentBalance.toFixed(2)}. Please add credits to run this feature.`, 
    requiresPayment: true 
  };
}

export function deductAdvancedFeatureCost(user: UserAccount | null): UserAccount | null {
  if (!user) return null;
  if (isOwnerUser(user)) return user;
  if (isBetaTesterUser(user) && user.testPermissions?.canUseAdvanced) return user;
  if (user.tier === 'pro') return user;

  const currentBalance = user.balance || 0;
  const newBalance = Math.max(0, Number((currentBalance - 3).toFixed(2)));
  const updated: UserAccount = {
    ...user,
    balance: newBalance,
    advancedRunsUsed: (user.advancedRunsUsed || 0) + 1
  };
  saveStoredUser(updated);
  return updated;
}

export function recordAndDeductAdvancedUsage(featureName: string = 'Advanced Feature', targetUser?: UserAccount | null): {
  user: UserAccount | null;
  deducted: number;
  remainingBalance: number;
} {
  const user = targetUser !== undefined ? targetUser : getStoredUser();
  if (!user) {
    return { user: null, deducted: 0, remainingBalance: 0 };
  }

  if (isOwnerUser(user)) {
    return { user, deducted: 0, remainingBalance: user.balance ?? 9999 };
  }

  if (isBetaTesterUser(user) && (user.testerPermissions?.canUseAdvanced || user.testPermissions?.canUseAdvanced)) {
    return { user, deducted: 0, remainingBalance: user.balance ?? 0 };
  }

  if (user.tier === 'pro') {
    return { user, deducted: 0, remainingBalance: user.balance ?? 0 };
  }

  const check = canUserRunAdvancedFeature(user, featureName);
  let deducted = 0;
  let newBalance = user.balance || 0;

  if (check.cost > 0) {
    deducted = Math.min(newBalance, check.cost);
    newBalance = Math.max(0, Number((newBalance - deducted).toFixed(2)));
  }

  const updated: UserAccount = {
    ...user,
    balance: newBalance,
    advancedRunsUsed: (user.advancedRunsUsed || 0) + 1
  };
  saveStoredUser(updated);
  return {
    user: updated,
    deducted,
    remainingBalance: newBalance
  };
}

// 1 free crawl: NO exports available, copy/paste and right click disabled
export function canUserExportData(user: UserAccount | null): { allowed: boolean; reason?: string } {
  if (isOwnerUser(user)) {
    return { allowed: true };
  }

  if (isBetaTesterUser(user)) {
    if (user?.testPermissions?.canExport) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Data exports (CSV/ZIP) are disabled for your test account. Contact a Super Admin to enable exports.' 
    };
  }

  if (!user) {
    return { 
      allowed: false, 
      reason: 'Data exports are locked on the 1 free crawl. Please sign in and add credit balance to unlock CSV and clean HTML exports.' 
    };
  }

  if (user.tier === 'pro' || (user.balance || 0) > 0 || user.tier === 'payg') {
    return { allowed: true };
  }

  // If user is on the free crawl (0 balance, free tier)
  return { 
    allowed: false, 
    reason: 'Data exports (CSV & Clean HTML ZIP) are not available on the 1 free crawl. Add credit balance ($1/crawl or $3/advanced) to unlock full downloads.' 
  };
}

export function canUserAccessCodebase(user: UserAccount | null): boolean {
  if (isOwnerUser(user)) return true;
  if (isBetaTesterUser(user)) return !!user?.testPermissions?.canAccessCodebase;
  return user?.tier === 'pro';
}

export function canUserAccessCicd(user: UserAccount | null): boolean {
  if (isOwnerUser(user)) return true;
  if (isBetaTesterUser(user)) return !!user?.testPermissions?.canAccessCicd;
  return user?.tier === 'pro';
}

export function addAccountCredits(user: UserAccount, amountDollars: number): UserAccount {
  const newBal = Number(((user.balance || 0) + amountDollars).toFixed(2));
  const updated: UserAccount = {
    ...user,
    tier: 'payg',
    balance: newBal,
    subscriptionPrice: `Pay-As-You-Go ($1/crawl, $3/adv) • Balance: $${newBal.toFixed(2)}`
  };
  saveStoredUser(updated);
  return updated;
}

export function connectGoogleCloudAccount(
  firstArg: string | UserAccount, 
  secondArg?: string | UserAccount
): UserAccount | null {
  let user: UserAccount | null = null;
  let projectId = '';

  if (typeof firstArg === 'string') {
    projectId = firstArg;
    user = (secondArg as UserAccount) || getStoredUser();
  } else {
    user = firstArg;
    projectId = typeof secondArg === 'string' ? secondArg : '';
  }

  if (!user) return null;
  const cleanId = projectId.trim() || 'default-gcp-project';
  const updated: UserAccount = {
    ...user,
    gcpConnected: true,
    gcpProjectId: cleanId
  };
  saveStoredUser(updated);
  return updated;
}

export function disconnectGoogleCloudAccount(userArg?: UserAccount | null): UserAccount | null {
  const user = userArg || getStoredUser();
  if (!user) return null;
  const updated: UserAccount = {
    ...user,
    gcpConnected: false,
    gcpProjectId: undefined
  };
  saveStoredUser(updated);
  return updated;
}

export function canUserAccessCredentialedFeatures(user: UserAccount | null): {
  allowed: boolean;
  reason?: string;
} {
  if (!user) {
    return {
      allowed: false,
      reason: 'Please sign in and connect your Google Cloud account to use credentialed features.'
    };
  }

  // Super Admins bypass and have full access
  if (isOwnerUser(user)) {
    return { allowed: true };
  }

  // Test users or regular users must connect their own Google Cloud account
  if (user.gcpConnected) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Credentialed features (SMTP email relay, API services) only work when you connect your own Google Cloud account.'
  };
}

// Snapshot & Store State
let cachedUserRaw: string | null = null;
let cachedUserObj: UserAccount | null = null;

export function getUserSnapshot(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedUserRaw) {
      cachedUserRaw = raw;
      cachedUserObj = raw ? JSON.parse(raw) : null;
      // Auto-reconcile super admin privileges for both super admins
      if (cachedUserObj && isOwnerEmail(cachedUserObj.email)) {
        if (!cachedUserObj.isOwner || cachedUserObj.tier !== 'superadmin') {
          cachedUserObj.isOwner = true;
          cachedUserObj.role = 'owner';
          cachedUserObj.tier = 'superadmin';
          cachedUserObj.superAdminUnlocked = true;
          cachedUserObj.balance = 9999;
          cachedUserObj.subscriptionPrice = 'Super Admin VIP — All Features Unlocked';
        }
      }
    }
    return cachedUserObj;
  } catch {
    return null;
  }
}

export function getServerUserSnapshot(): null {
  return null;
}

export function useUserAccount(): UserAccount | null {
  return useSyncExternalStore(
    subscribeUser,
    getUserSnapshot,
    getServerUserSnapshot
  );
}

const emptySubscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function getStoredUser(): UserAccount | null {
  return getUserSnapshot();
}

export function saveStoredUser(user: UserAccount | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      cachedUserRaw = null;
      cachedUserObj = null;
    } else {
      // Re-verify super admin status
      if (isOwnerEmail(user.email)) {
        user.isOwner = true;
        user.role = 'owner';
        user.tier = 'superadmin';
        user.superAdminUnlocked = true;
        user.balance = 9999;
        user.subscriptionPrice = 'Super Admin VIP — All Features Unlocked';
      } else if (isEmailInvitedBetaTester(user.email)) {
        user.isBetaTester = true;
        user.role = 'beta_tester';
        user.tier = 'beta';
        const invite = getInviteForEmail(user.email);
        if (invite) {
          user.testPermissions = invite.permissions;
          user.subscriptionPrice = `Test User (${invite.permissions.allowedCrawls} crawls allowed)`;
        }
      }

      const json = JSON.stringify(user);
      localStorage.setItem(STORAGE_KEY, json);
      cachedUserRaw = json;
      cachedUserObj = user;
      // Also update in registered users DB
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      const users: Record<string, UserAccount> = usersRaw ? JSON.parse(usersRaw) : {};
      users[user.email.toLowerCase()] = user;
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    }
    notifyUserChanged();
  } catch (e) {
    console.error('Failed to save user in storage:', e);
  }
}

// Google Sign In Authentication
export function signInWithGoogle(googleUser: { name?: string; email: string; picture?: string }): UserAccount {
  const cleanEmail = googleUser.email.trim().toLowerCase();
  const isOwner = isOwnerEmail(cleanEmail);
  const isBeta = !isOwner && isEmailInvitedBetaTester(cleanEmail);

  let existingUser: UserAccount | null = null;
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      const users: Record<string, UserAccount> = usersRaw ? JSON.parse(usersRaw) : {};
      if (users[cleanEmail]) {
        existingUser = users[cleanEmail];
      }
    } catch {}
  }

  const now = new Date().toISOString();
  let user: UserAccount;

  if (isOwner) {
    // Super Admins (jgibsonwebdesign@gmail.com, jason@holisticgrowthmarketing.com)
    const adminDisplayName = cleanEmail.includes('jgibson') ? 'J. Gibson (Super Admin)' : 'Jason (Super Admin)';
    user = {
      id: existingUser?.id || `usr_admin_${Date.now()}`,
      name: googleUser.name?.trim() || existingUser?.name || adminDisplayName,
      email: cleanEmail,
      picture: googleUser.picture || existingUser?.picture,
      authProvider: 'google',
      tier: 'superadmin',
      role: 'owner',
      isOwner: true,
      isBetaTester: false,
      superAdminUnlocked: true,
      crawlsUsed: existingUser?.crawlsUsed || 0,
      maxFreeCrawls: 999999,
      balance: 9999,
      createdAt: existingUser?.createdAt || now,
      subscriptionPrice: 'Super Admin VIP — All Features Unlocked'
    };
  } else if (isBeta) {
    // Early Adopter / Limited Test User
    const invite = getInviteForEmail(cleanEmail);
    const permissions = invite?.permissions || DEFAULT_TESTER_PERMISSIONS;
    user = {
      id: existingUser?.id || `usr_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: googleUser.name?.trim() || existingUser?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      picture: googleUser.picture || existingUser?.picture,
      authProvider: 'google',
      tier: 'beta',
      role: 'beta_tester',
      isOwner: false,
      isBetaTester: true,
      superAdminUnlocked: false,
      testPermissions: permissions,
      crawlsUsed: existingUser?.crawlsUsed || 0,
      maxFreeCrawls: permissions.allowedCrawls,
      balance: existingUser?.balance || 0,
      createdAt: existingUser?.createdAt || now,
      subscriptionPrice: `Test User (${permissions.allowedCrawls} crawls allowed)`
    };
  } else {
    // Standard User (1 free crawl, then $1/crawl, $3/adv)
    user = {
      id: existingUser?.id || `usr_goog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: googleUser.name?.trim() || existingUser?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      picture: googleUser.picture || existingUser?.picture,
      authProvider: 'google',
      tier: existingUser?.tier || 'free',
      role: existingUser?.role || 'viewer',
      isOwner: false,
      isBetaTester: false,
      crawlsUsed: existingUser?.crawlsUsed || 0,
      maxFreeCrawls: 1,
      balance: existingUser?.balance || 0,
      advancedRunsUsed: existingUser?.advancedRunsUsed || 0,
      createdAt: existingUser?.createdAt || now,
      subscriptionPrice: existingUser?.subscriptionPrice || '1 Free Crawl • $1/crawl, $3/adv'
    };
  }

  saveStoredUser(user);
  return user;
}

export function createAccount(name: string, email: string): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const isOwner = isOwnerEmail(cleanEmail);
  const isBeta = !isOwner && isEmailInvitedBetaTester(cleanEmail);
  
  // Check if existing user in DB
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_DB_KEY);
      const users: Record<string, UserAccount> = usersRaw ? JSON.parse(usersRaw) : {};
      if (users[cleanEmail]) {
        const existing = users[cleanEmail];
        if (isOwner) {
          existing.isOwner = true;
          existing.role = 'owner';
          existing.tier = 'superadmin';
          existing.superAdminUnlocked = true;
          existing.balance = 9999;
        } else if (isBeta) {
          existing.isBetaTester = true;
          existing.role = 'beta_tester';
          existing.tier = 'beta';
          const invite = getInviteForEmail(cleanEmail);
          if (invite) existing.testPermissions = invite.permissions;
        }
        saveStoredUser(existing);
        return existing;
      }
    } catch {}
  }

  const now = new Date().toISOString();
  let newUser: UserAccount;

  if (isOwner) {
    const adminDisplayName = cleanEmail.includes('jgibson') ? 'J. Gibson (Super Admin)' : 'Jason (Super Admin)';
    newUser = {
      id: `usr_owner_${Date.now()}`,
      name: name.trim() || adminDisplayName,
      email: cleanEmail,
      authProvider: 'email',
      tier: 'superadmin',
      role: 'owner',
      isOwner: true,
      isBetaTester: false,
      superAdminUnlocked: true,
      crawlsUsed: 0,
      maxFreeCrawls: 999999,
      balance: 9999,
      createdAt: now,
      subscriptionPrice: 'Super Admin VIP — All Features Unlocked'
    };
  } else if (isBeta) {
    const invite = getInviteForEmail(cleanEmail);
    const permissions = invite?.permissions || DEFAULT_TESTER_PERMISSIONS;
    newUser = {
      id: `usr_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      authProvider: 'email',
      tier: 'beta',
      role: 'beta_tester',
      isOwner: false,
      isBetaTester: true,
      superAdminUnlocked: false,
      testPermissions: permissions,
      crawlsUsed: 0,
      maxFreeCrawls: permissions.allowedCrawls,
      balance: 0,
      createdAt: now,
      subscriptionPrice: `Test User (${permissions.allowedCrawls} crawls allowed)`
    };
  } else {
    newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      authProvider: 'email',
      tier: 'free',
      crawlsUsed: 0,
      maxFreeCrawls: 1,
      balance: 0,
      advancedRunsUsed: 0,
      createdAt: now,
      subscriptionPrice: '1 Free Crawl • $1/crawl, $3/adv'
    };
  }

  saveStoredUser(newUser);
  return newUser;
}

export function upgradeUserToPro(user: UserAccount, last4: string = '4242'): UserAccount {
  const now = new Date();
  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + 1);

  const upgraded: UserAccount = {
    ...user,
    tier: 'pro',
    balance: (user.balance || 0) + 20,
    subscribedAt: now.toISOString(),
    subscriptionRenewal: renewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    paymentLast4: last4,
    subscriptionPrice: '$20/month • Unlimited Crawls'
  };

  saveStoredUser(upgraded);
  return upgraded;
}

export function cancelUserSubscription(user: UserAccount): UserAccount {
  const updated: UserAccount = {
    ...user,
    tier: 'free',
    subscribedAt: undefined,
    subscriptionRenewal: undefined,
    paymentLast4: undefined,
    subscriptionPrice: '1 Free Crawl • $1/crawl, $3/adv'
  };
  saveStoredUser(updated);
  return updated;
}

export function incrementCrawlUsage(user: UserAccount): UserAccount {
  const result = recordAndDeductCrawlUsage(user);
  return result.user || user;
}

export function recordCrawlUsage(): UserAccount | null {
  const current = getStoredUser();
  if (!current) return null;
  const result = recordAndDeductCrawlUsage(current);
  return result.user;
}

export function logoutUser(): void {
  saveStoredUser(null);
}
