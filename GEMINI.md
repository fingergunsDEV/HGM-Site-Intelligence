# Site Intelligence Platform — AI Assistant & Engineering Context (`GEMINI.md`)

## 1. Project Overview & Identity
The **Site Intelligence Platform** is an enterprise-grade SEO and Schema crawler, site audit engine, internal link graph analyzer, and automated HTML remediation tool. Built as a modern Next.js application, it provides real-time streaming crawls, automated Schema.org JSON-LD generation, AI-powered metadata enhancements (via Google Gemini), anti-scraping protections, and one-click bulk clean-HTML regeneration.

- **Application Name**: Site Intelligence Platform
- **Current Version**: 0.1.0
- **Runtime Environment**: Next.js 15+ (App Router), React 19, Node.js (Cloud Run container on port 3000)
- **Primary Domain Use-Cases**:
  - Live and simulated multi-page URL crawling and XML sitemap parsing
  - Automated SEO audits (Title tags, Meta descriptions, Canonical links, H1/H2 hierarchy, Image ALT attributes, Word counts, Status codes)
  - Schema.org microdata and JSON-LD synthesis (`WebPage`, `Article`, `Product`, `LocalBusiness`, `FAQPage`, `BreadcrumbList`)
  - "Auto-Fix All" engine that repairs audit defects and generates complete, clean HTML files
  - Interactive internal link graph topology and SEO heatmap visualization
  - Auth system with Free Trial vs. Pro Plan ($20/month) subscription gating and clipboard/copy protections

---

## 2. Technology Stack & Dependencies

### Core Frameworks & Libraries
- **Next.js 15.4.9**: App Router (`/app`), React Server Components, Server-Side API routes
- **React 19.2.1**: UI layer with concurrent features and `useSyncExternalStore` for SSR hydration safety
- **Tailwind CSS 4.1.11**: Styled via `@tailwindcss/postcss` and `@tailwindcss/typography`
- **TypeScript 5.9.3**: Strict type checking across domain models and components

### Parsing, Data, & Compression
- **Cheerio 1.2.0**: Server-side and browser-based DOM parsing, tag extraction, and HTML manipulation
- **Fast-XML-Parser 5.11.0**: Robust sitemap XML index and nested sitemap parsing
- **JSZip 3.10.1**: Client-side bundling of corrected HTML files, schemas, and CSV audit reports
- **Nodemailer 9.0.5**: SMTP dispatching and audit summary email notifications

### AI & Animations
- **@google/genai 2.4.0**: Server-side Google Gemini SDK integration (`gemini-2.5-flash` / `gemini-3.5-flash`)
- **Lucide React 0.553.0**: Consistent, scalable vector icon library
- **Motion 12.23.24**: Fluid transitions, drawers, and modal animations
- **Canvas-Confetti 1.9.4**: User milestone and audit completion animations

---

## 3. Directory Structure & Key Files

```
├── app/
│   ├── api/
│   │   ├── ai-suggest/route.ts   # Gemini API route for SEO & Schema remediation
│   │   ├── codebase/route.ts     # Project file tree inspection endpoint
│   │   ├── crawl/route.ts        # Server-side HTML fetching and CORS proxy
│   │   └── smtp/route.ts         # SMTP test and email alert delivery
│   ├── globals.css               # Tailwind CSS imports and base styles
│   ├── layout.tsx                # Root layout, HTML metadata, fonts, viewport
│   └── page.tsx                  # Main orchestration container & state controller
├── components/
│   ├── AISuggestionsView.tsx     # Gemini AI batch recommendations dashboard
│   ├── ArchitectureExplorer.tsx  # Interactive codebase and structural inspector
│   ├── AuditDrawer.tsx           # Slide-out single-page audit inspector & raw HTML viewer
│   ├── AuthModal.tsx             # Authentication modal (Sign Up / Sign In)
│   ├── CodebaseManager.tsx       # Live project code viewer and editor
│   ├── ConfigPanel.tsx           # Crawl configuration panel (depth, threads, sitemap URL)
│   ├── ContentProtection.tsx     # Anti-scraping copy/paste & right-click protector
│   ├── ControlBar.tsx            # Crawl execution buttons, Fix All, CSV & ZIP exports
│   ├── FixAllModal.tsx           # Auto-Fix All preview, diff viewer, and ZIP export
│   ├── Header.tsx                # Top navigation, status indicator, user account dropdown
│   ├── LinkGraphVisualizer.tsx   # Canvas-based internal link graph network
│   ├── LogStream.tsx             # Terminal-style live crawl event logger
│   ├── ProgressDashboard.tsx     # Health score gauges, issue counters, progress bars
│   ├── ResultsTable.tsx          # Paginated, filterable audit inventory table
│   ├── SchemaModal.tsx           # Schema.org JSON-LD viewer and validator
│   ├── SeoHeatmap.tsx            # Visual issue severity & link density heatmap
│   ├── SmtpManagerModal.tsx      # SMTP credentials and alert configuration
│   └── SubscriptionModal.tsx     # Pro Plan ($20/mo) upgrade dialog
├── lib/
│   ├── auth-storage.ts           # SSR-safe reactive user store (useSyncExternalStore)
│   ├── crawler-engine.ts         # Core crawler logic, audit rules, presets, schema generator
│   ├── export-utils.ts           # CSV audit generators and JSZip packaging
│   ├── gemini.ts                 # Server-side Gemini SDK client wrapper
│   ├── html-codebase-engine.ts   # Virtual file-system and HTML parser helpers
│   ├── html-fixer.ts             # Complete HTML correction engine (titles, meta, H1, alt tags)
│   ├── project-architecture.ts   # Architecture metadata and documentation data
│   └── utils.ts                  # Utility class merging (clsx + tailwind-merge)
├── types/
│   ├── auth.ts                   # User account, plan tier, and session interfaces
│   └── site-intelligence.ts      # PageMetadata, AuditIssue, CrawlConfig, CrawlSummary
├── metadata.json                 # AI Studio applet configuration & frame permissions
├── .env.example                  # Documented environment variable definitions
└── GEMINI.md                     # System instruction & agent architecture reference
```

---

## 4. Key Architectural Patterns & Conventions

### 1. Hydration & State Safety
- **No SSR/CSR Mismatches**: Use `useSyncExternalStore` (as in `lib/auth-storage.ts`) and mount guards (`useIsMounted`) for client-only state such as `localStorage` or session cookies.
- **Pure Event-Driven State**: Avoid calling `setState` directly in component body or synchronously inside `useEffect`.

### 2. Security & API Keys
- All Gemini API calls **must** be executed server-side via Next.js API Routes (`/app/api/ai-suggest`) using `process.env.GEMINI_API_KEY`.
- The `GEMINI_API_KEY` is never prefixed with `NEXT_PUBLIC_` and is never exposed to the client.

### 3. SEO & HTML Remediation Rules (`lib/html-fixer.ts`)
- **Title Tag**: Enforce 30–60 characters; auto-generate or append brand if missing.
- **Meta Description**: Enforce 70–160 characters; synthesize from page text or H1 if missing.
- **Heading Structure**: Ensure strictly one `<h1>` per page. Convert duplicate `<h1>` tags to `<h2>`.
- **Image Accessibility**: Locate all `<img>` tags missing `alt` attributes and inject context-aware descriptive alt attributes.
- **Canonical URLs**: Verify `<link rel="canonical" href="...">` presence; auto-inject self-referential canonical tags.
- **OpenGraph & Schema.org**: Embed standard OpenGraph tags (`og:title`, `og:description`, `og:url`) and structured `<script type="application/ld+json">`.

### 4. Subscription & Access Controls
- Users receive **1 Free Test Crawl**.
- Pro features (Bulk CSV exports, Clean HTML `.zip` downloads, Unlimited live crawling) require upgrading to the **Pro Plan ($20/month)**.
- Anti-scraping mechanisms in `ContentProtection.tsx` block casual table text-scraping, right-click context menus, and developer inspect shortcuts for unauthenticated/free users while providing clear upgrade callouts.

### 5. Google Analytics 4 & Search Console Integration (`lib/google/`, `app/api/google/`)
- REST-only (no `googleapis` dependency). Server-side only; client UI lives in `components/GoogleDataView.tsx` (tab id `google`).
- Auth priority per request: visitor OAuth cookie (encrypted httpOnly `hgm_google_oauth`) > `GOOGLE_REFRESH_TOKEN` > service account.
- Scopes: `analytics.readonly`, `webmasters.readonly`. Endpoints are documented in `lib/google/config.ts`.
- `GOOGLE_PRIVATE_KEY` may contain literal `\n` sequences; `normalizePrivateKey()` converts them. Do not add extra escaping.
- Unit tests: `bun test` (`lib/google/google.test.ts`, excluded from the Next.js type check).

---

## 5. Development & Build Verification Commands

- `npm run dev`: Starts local development server on port 3000
- `npm run lint`: Runs ESLint 9 checks across all TypeScript and React files
- `npm run build`: Executes production Next.js compilation and type check
- `bun test`: Runs unit tests (GA4 / Search Console request builders and env parsing)
