export type PlanTier = 'free' | 'payg' | 'pro' | 'superadmin' | 'beta';
export type UserRole = 'owner' | 'superadmin' | 'beta_tester' | 'operator' | 'viewer';

export interface TestUserPermissions {
  allowedCrawls: number;         // e.g. 5 crawls allowed for test user
  canExport: boolean;            // CSV & ZIP export permission
  canUseAdvanced: boolean;       // $3/run Advanced Features (Fix All, AI Suggestions, Schema)
  canAccessCodebase: boolean;    // Access Codebase IDE
  canAccessCicd: boolean;        // Access CI/CD Pipeline
  allowSmtpWithoutGcp: boolean;  // Bypass Google Cloud account requirement for SMTP
}

export interface BetaTesterInvite {
  id: string;
  email: string;
  name?: string;
  invitedBy: string;
  invitedAt: string;
  notes?: string;
  status: 'active' | 'revoked';
  permissions: TestUserPermissions;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  picture?: string;
  authProvider?: 'google' | 'email';
  tier: PlanTier;
  role?: UserRole;
  isOwner?: boolean;
  isBetaTester?: boolean;
  superAdminUnlocked?: boolean;
  crawlsUsed: number;
  crawlsRunCount?: number;
  maxFreeCrawls: number; // 1 free crawl included
  balance: number;       // Credit balance in dollars ($1 per crawl, $3 per advanced run)
  advancedRunsUsed?: number;
  createdAt: string;
  subscribedAt?: string;
  subscriptionRenewal?: string;
  subscriptionPrice: string; // "1 Free Crawl + $1/crawl, $3/adv", "Super Admin VIP"
  paymentLast4?: string;
  testPermissions?: TestUserPermissions;
  testerPermissions?: TestUserPermissions;
  gcpConnected?: boolean;
  gcpProjectId?: string;
}

export interface AuthState {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
