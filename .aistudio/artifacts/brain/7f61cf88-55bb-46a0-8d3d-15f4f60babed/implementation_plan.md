# KnowMobiles Founder Workspace & Multi-Shop Architecture

A clean multi-shop directory structure isolating each shop client into independent deployable folders under `KnowMobiles/Shops/`, paired with an obsidian and gold Founder Workspace under `KnowMobiles/AdminWorkSpace/` for cross-shop telemetry, daily performance monitoring, and secure credential oversight.

> [!IMPORTANT]
> **User Review & Confirmed Decisions**
> 
> - **Folder Architecture**: Clean parent `KnowMobiles/` folder containing `AdminWorkSpace/` (independent Founder monitoring web app) and `Shops/` (containing `ArshadMobileZone/` and future duplicated shops).
> - **No In-Shop Fleet Buttons**: Completely removes the Fleet Master / Admin button from Arshad Mobile Zone. The shop operates as a 100% dedicated, independent client storefront.
> - **One-Time Signup Lock**: Each shop allows exactly one email signup through standard sign-in/sign-up forms. Once registered, signups are permanently disabled for that shop and only standard sign-in remains active.
> - **Founder Credential Tracking**: Shopkeeper registration records (email, stored password reference/hash, created date, shop affiliation) are stored in a dedicated Firestore `admin_credentials` collection accessible exclusively by the founder inside the KnowMobiles workspace.
> - **Visual Theme**: Deep obsidian black (`#0B0F17`) and luxury polished gold (`#D97706` / `#F59E0B`) matching the signature Arshad Mobile aesthetic with responsive mobile layouts and PWA installability.

---

### 1. Overview & Core Concept

- **What It Does**: 
  - Restructures the project into a modular client architecture: `KnowMobiles/AdminWorkSpace` (the Founder's command center) and `KnowMobiles/Shops/ArshadMobileZone` (the isolated retail shop app).
  - Provides the Founder with an executive real-time overview of all managed shops: daily sales volume, profit margins, inventory levels, entry counts, and daily performance charts.
  - Implements a single-registration lock per shop, ensuring only the official shop owner can create the primary account, while preventing unauthorized additional accounts.
  - Equips both the Founder Workspace and shop apps with Progressive Web App (PWA) offline manifests, mobile-first touch navigation, and standalone install capabilities.
- **Target Audience / Persona**: 
  - **Founder / Super Admin**: Oversees multiple mobile retail shops across different domains, verifies health metrics, and manages client credentials.
  - **Shopkeeper (e.g., Arshad Mobile Zone)**: Operates inventory, sales, bills, and khata ledgers without any distracting multi-tenant or parent platform controls.
- **Key Value**: Clean separation of codebases for independent Vercel deployments, preventing client cross-contamination while retaining a unified cloud database for executive founder tracking.

---

### 2. User Experience & Visual Design

#### Key User Flows

1. **Shop Registration & Single-Signup Lock**:
   - The shopkeeper opens their dedicated shop URL (`ArshadMobileZone`).
   - If no owner account exists for this shop, the signup tab is visible.
   - The owner signs up with their business email and password.
   - The shop system automatically writes their credentials to `admin_credentials` and locks the signup feature.
   - Subsequent visitors see only the Sign In form; any attempt to create a second account is blocked with a clear message: *"Registration closed for this shop. Please sign in."*

2. **Founder Workspace Entry & Dashboard**:
   - The Founder opens the KnowMobiles Admin Workspace on their private domain.
   - Signs in with Founder credentials.
   - Lands on the Executive Command Center displaying total shops connected, daily GMV, total inventory valuation, and aggregated profits.
   - Switches between dedicated workspace sections: **Overview & Analytics**, **Shop Directory & Credentials**, **Daily Entry Logs**, and **New Shop Provisioning**.

3. **Shop Deep Dive & Credential Monitoring**:
   - The Founder selects a shop card (e.g., *Arshad Mobile Zone*).
   - Views shop vitals: daily sales trend graph, transaction counts, stock alerts, and owner credentials (email, password reference, registration timestamp, last active).
   - Toggles shop operational status (Active / Suspended) with immediate database enforcement.

4. **Mobile Experience & PWA Installation**:
   - Both applications include responsive layouts optimized for mobile viewports ($\ge 44\text{px}$ touch targets, sticky bottom navigation bars on mobile, and zero horizontal overflow).
   - When opened in mobile Safari or Chrome, users receive an unobtrusive "Install App" prompt configured with custom luxury gold app icons and standalone display mode.

#### Visual Identity & Theme

- **Aesthetic Direction**: Deep Obsidian Luxury — high-density executive dashboard styling with refined metallic gold highlights, razor-thin borders, and crisp typography.
- **Color Palette**:
  - Neutral Canvas: Deep Obsidian (`#0B0F17`) and Midnight Gray (`#111827`)
  - Structural Surfaces: Charcoal Slate (`#1E2638`) with hairline borders (`#2D3748`)
  - Primary Accent: Royal Amber Gold (`#F59E0B`, hover `#D97706`)
  - Text Tokens: Pure White (`#F9FAFB`) for headings, Silver Muted (`#9CA3AF`) for body and secondary metadata
  - Status Accents: Emerald (`#10B981`) for nominal/active, Crimson (`#EF4444`) for alerts/suspended
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` or `Outfit` for brand elegance and high-contrast readability
  - Body & Controls: `DM Sans` / `Plus Jakarta Sans` with balanced line heights
  - Data, Metrics & Timestamps: Tabular monospace figures (`font-mono tabular-nums`) to prevent layout shift
- **Interactive Feedback**:
  - Subtle hover elevation and soft ambient glows on gold action controls
  - Real-time animated counters for daily transaction metrics
  - Confirmation toasts for status updates and credential copy actions

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Physical Folder Duplication vs. Monorepo Configs**
  - *Chosen Approach*: Physical filesystem separation: `KnowMobiles/AdminWorkSpace` and `KnowMobiles/Shops/ArshadMobileZone`. Each folder contains its own self-contained React project, `package.json`, and Vite config.
  - *Why*: Perfectly aligns with the requirement to deploy each shop independently to its own Vercel domain, and allows future custom client modifications without touching other shops.
  - *Trade-Off*: Code is duplicated across shop folders rather than shared via an npm package, but this guarantees zero regression risk when customizing a single client's shop.

- **Decision 2: Elimination of Fleet Master Switcher in Shopfronts**
  - *Chosen Approach*: Completely eradicate the Fleet button and admin route from `ArshadMobileZone`.
  - *Why*: The shop app is exclusively for the shopkeeper. Having founder tools or navigation inside client shops compromises privacy and confuses users.

- **Decision 3: Firestore Single-Signup Lock Mechanism**
  - *Chosen Approach*: Atomic verification against a `shop_registrations` document mapping `shopId` to `ownerUid`. If a registration already exists for that shop, the signup handler rejects new requests, and the frontend dynamically removes the signup tab.
  - *Why*: Guarantees that only one primary administrator exists per shop while preserving Firebase Auth standard login flows.

- **Decision 4: Founder Credential Vault**
  - *Chosen Approach*: Write shopkeeper credentials into a protected `admin_credentials` collection upon signup. Restricted by Firestore security rules so that only the Founder's UID/email can read the collection.
  - *Why*: Allows the Founder to review all shop logins in their Admin Workspace while keeping standard customers and unauthorized users locked out.

---

### 4. Technical Architecture & Data Strategy

#### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            KnowMobiles Platform                             │
├──────────────────────────────────────┬──────────────────────────────────────┤
│    KnowMobiles/AdminWorkSpace        │   KnowMobiles/Shops/ArshadMobileZone  │
│    (Founder Command Center)          │   (Dedicated Shopkeeper Storefront)  │
│                                      │                                      │
│  ┌────────────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ Executive Dashboard            │  │  │ Point of Sale (POS) & Bills    │  │
│  │ - Fleet Sales & Profit Charts  │  │  │ Inventory & Mobile Stock       │  │
│  │ - Shop Status Toggles          │  │  │ Khata Credit Management        │  │
│  │ - Credential Vault             │  │  │ Daily Expense Ledger           │  │
│  │ - Entry Volume Telemetry       │  │  │ Single-Signup Auth Gate        │  │
│  └───────────────┬────────────────┘  │  └───────────────┬────────────────┘  │
│                  │                   │                  │                   │
│                  ▼                   │                  ▼                   │
│         [PWA Service Worker]         │         [PWA Service Worker]         │
└──────────────────┼───────────────────┴──────────────────┼───────────────────┘
                   │                                      │
                   ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Shared Firebase Firestore & Auth                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  • admin_credentials/{shopId}      - Founder credential tracking & vault    │
│  • shop_registrations/{shopId}    - Enforces 1-time signup lock per shop   │
│  • shops/{shopId}                 - Shop metadata, status, & telemetry     │
│  • sales, bills, mobiles, khata   - Operational shop collections            │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Directory Layout

- `KnowMobiles/`: Parent root directory.
  - `AdminWorkSpace/`: Complete standalone React + Vite + Tailwind PWA app for Founder monitoring.
    - `src/pages/`: Executive Overview, Shop Directory, Credential Vault, Entry Logs.
    - `src/components/`: Recharts analytics, KPI cards, Shop detail panels, PWA install prompt.
    - `public/`: Luxury KnowMobiles PWA icons and web manifest.
  - `Shops/`: Directory for client instances.
    - `ArshadMobileZone/`: Fully isolated Arshad Mobile Zone codebase with:
      - Fleet Master button eradicated from navbar, login page, and router.
      - 1-time signup enforcement logic in `LoginPage.tsx`.
      - Credential sync to `admin_credentials` in Firestore.
      - Responsive mobile layout with dedicated PWA manifest and mobile install modal.
    - `_TemplateShop/`: Clean ready-to-duplicate starter folder for future client onboardings.

#### Data Model & Schema Additions

1. **`admin_credentials/{shopId}`**:
   - `shopId`: string (e.g., `'arshad-mobile-zone'`)
   - `shopName`: string
   - `ownerEmail`: string
   - `passwordReference`: string (stored credential for founder visibility)
   - `createdAt`: Timestamp
   - `lastLoginAt`: Timestamp
   - `status`: `'active' | 'suspended'`

2. **`shop_registrations/{shopId}`**:
   - `registered`: boolean
   - `ownerUid`: string
   - `registeredAt`: Timestamp

3. **`shops/{shopId}`**:
   - `name`: string
   - `status`: `'active' | 'suspended'`
   - `dailyStats`: object with `{ todaySales, todayProfit, todayEntries, stockCount }`
   - `updatedAt`: Timestamp

#### Step-by-Step Implementation Sequence

1. **Step 1: Codebase Relocation & Structure Setup**
   - Cleanly duplicate the Arshad Mobile codebase into `KnowMobiles/Shops/ArshadMobileZone/`.
   - Create `KnowMobiles/Shops/_TemplateShop/` as an easily duplicable template for future clients.
   - Build out `KnowMobiles/AdminWorkSpace/` with its independent build scripts, package configuration, and luxury obsidian theme.

2. **Step 2: Remove Fleet Master & Admin Switchers from Arshad Mobile Zone**
   - Strip all KnowMobiles Fleet links and buttons from `Navbar.tsx`, `LoginPage.tsx`, and `App.tsx`.
   - Restore Arshad Mobile Zone to a pure, client-facing retail management application.

3. **Step 3: Implement 1-Time Signup Lock & Credential Sync**
   - Update the auth flow in `ArshadMobileZone`:
     - Before displaying or executing signup, query `shop_registrations/arshad-mobile-zone`.
     - If registered, disable signup UI and reject signup attempts.
     - On initial owner registration, write to `shop_registrations` (locking future signups) and record login credentials in `admin_credentials`.

4. **Step 4: Build KnowMobiles Founder Admin Workspace**
   - Develop the full-featured Founder command dashboard inside `KnowMobiles/AdminWorkSpace`:
     - Real-time shop aggregation (sales volume, profit, item count, entry count).
     - Interactive charts (daily performance, revenue vs. expense).
     - Credential Manager displaying shopkeeper emails and passwords with quick copy and status toggles.
     - Duplication guide and quick-action tooling for creating new shop instances.

5. **Step 5: Mobile-Friendly Refinement & PWA Integration**
   - Configure Web App Manifests, service workers via `vite-plugin-pwa`, and high-resolution icons for both apps.
   - Implement `PWAInstallButton` and responsive mobile touch optimizations.
   - Update Firestore security rules to protect the `admin_credentials` and `shop_registrations` collections.

6. **Step 6: Build Verification**
   - Verify smooth compilation of both applications (`ArshadMobileZone` and `AdminWorkSpace`) and confirm dev server stability.
