# Multi-Tenant Shop Platform & Dynamic Brand Architecture

Transform the single-shop mobile store management system into a robust, multi-tenant SaaS platform where multiple shop owners (e.g., Arshad Mobile Zone, Usman Afridi, etc.) can sign up with their own email or Google account, manage their own isolated inventory and khata data in a single Firestore database, customize their shop branding with auto-generated initial badges and custom headers, and sync dedicated shop backups directly to Google Drive.

***

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core product decisions have been synthesized from your specifications and Phase 1 clarification answers:

- **Single Firestore Multi-Tenancy**: All shop documents (`mobiles`, `sales`, `bills`, `khata`, `khataTransactions`, `expenses`) will carry a persistent `shopId` (linked directly to the shop owner's account UID) ensuring complete data isolation so Shop A never sees or modifies Shop B's records.
- **Arshad Mobile Zone Legacy Protection**: Existing historical records currently in Firestore without a `shopId` or `userId` are automatically mapped to Arshad Mobile Zone (`shopId: 'arshad-mobile-zone'`) and associated with the owner's Google account (`threadsandtailsshop@gmail.com`). Existing data will remain visible and intact.
- **Dynamic Initials & Visual Identity System**: When a shop enters or changes its name (such as "Usman Afridi"), the system generates a dynamic two-letter monogram avatar ("UA" on a branded gradient badge) that updates across the top navigation bar, mobile drawer, print receipts/bills, WhatsApp messages, page `<title>`, and mobile PWA homescreen icon.
- **Google Drive Shop Backup Sync**: Each shop owner can connect their Google Drive with one click via official Google OAuth (`drive.file` scope) to automatically export and sync a dedicated backup file formatted as `[Shop_Name]_Backup.json` into their personal Google Drive folder.

***

## 1. Overview & Core Concept

### What It Does
The platform converts the existing application into a multi-tenant cloud software for mobile phone shops, repair centers, and accessories retailers. When a new shopkeeper registers or signs in via Google:
1. A dedicated shop profile document (`shops/{shopId}`) is created with their shop name, owner name, contact numbers, address, and invoice footer notes.
2. The UI transforms into their shop's identity, displaying their custom shop name and an initials badge (e.g., "UA" for Usman Afridi, "AMZ" for Arshad Mobile Zone).
3. All operations (purchasing mobiles, generating sale bills, recording khata loans/recoveries, tracking daily expenses) are scoped to their shop ID.
4. Backups are saved individually per shop to the shopkeeper's Google Drive without mixing data between shops.

### Target Audience & Persona
- **Shop Owners & Managers**: Independent retail owners who need inventory tracking, IMEI logging, customer credit ledgers (Khata), and printable customer receipts.
- **Staff / Counter Operators**: Quick-entry operators making fast sales and checking stock without seeing other shops' data.

### Key Value
- **Zero Deployment Overhead**: No need to duplicate code folders or deploy separate websites for every client. One deployed web app serves unlimited independent shops.
- **Total Data Privacy**: Each shop's sales, profits, customer khata, and cash flow remain strictly private.
- **Instant Branding**: A new shopkeeper can start using their branded system within 30 seconds of typing their shop name.

***

## 2. User Experience & Visual Design

### Key User Flows

1. **Sign Up & Onboarding**:
   - New user signs up using Google or Email/Password.
   - If first time, an intuitive quick onboarding modal asks: *"Enter Shop Name"* (e.g., "Usman Afridi Mobile Center"), *"Phone Number"*, and *"City/Market Address"*.
   - The app derives the monogram ("UA"), generates the dynamic brand badge, and transitions straight into the personalized dashboard.

2. **Shop Settings & Live Preview**:
   - The **Settings** page features a dedicated **"Shop Profile & Branding"** card.
   - Fields: Shop Name, Short Tag / Monogram (editable override), Owner Name, WhatsApp / Phone 1, Secondary Phone, Shop Address, Receipt Note / Terms, and Currency Symbol (`Rs.`).
   - A live interactive receipt and header preview shows how their logo monogram, shop name, and contact details appear on actual invoices and WhatsApp slips.

3. **Multi-Tenant Operations**:
   - **Mobiles Inventory & Purchase**: Stock, IMEI numbers, purchase prices, and supplier history belong only to the logged-in shop.
   - **Quick Sale & Bills History**: Invoices display the current shop's name, phone, address, and monogram in the header. Sales receipts print in 80mm POS or A4 format.
   - **Khata Ledger**: Customer debt and payment history are strictly private to each shopkeeper. WhatsApp notifications sent to customers automatically use the active shop's name.
   - **Expenses & Daily P&L**: Profit calculations only aggregate the current shop's transactions.

4. **Google Drive Backup & Restore**:
   - Under Settings > Data Management, a dedicated Google Drive card displays connection status.
   - Clicking **"Sync Backup to Google Drive"** prompts Google Drive consent, verifies credentials, creates or updates `[Shop Name] Data Backup.json`, and displays the last sync timestamp with direct link to the file in Drive.

### Visual Identity & Theme

- **Aesthetic Direction**: High-density, utilitarian dark/light dashboard engineered for fast retail counter transactions with crisp borders, zero fluff, and high-contrast typography.
- **Color Palette**:
  - Dominant Neutral Canvas: Deep dark slate (`#0B0D13` / `#12151E`) with clean light mode support (`#F8FAFC`).
  - Structural Surfaces: Flat cards with 1px hairline borders (`#1E2333` in dark, `#E2E8F0` in light), zero noisy drop shadows.
  - Accent Color: Emerald / Amber gold accent (`#10B981` / `#F59E0B`) for action buttons, profit indicators, and primary CTAs.
  - Dynamic Monogram Badge: Gradient avatars rendered dynamically with accessible contrast (e.g., `#1E40AF` to `#3B82F6` with bold white lettering).
- **Typography**:
  - Headings & Navigation: `Plus Jakarta Sans` / `Manrope` with clean weight hierarchy.
  - Numbers, Balances & IMEIs: Strictly tabular monospace (`tabular-nums font-mono`) to prevent layout jitter on currency amounts and stock counts.
- **Top Bar Contract**:
  - Left Zone: Dynamic Monogram Badge + Active Shop Name + Market/City subtitle.
  - Center Zone: Single-line navigation links (`Inventory`, `Sales`, `Khata`, `Expenses`).
  - Right Zone: Shop Switcher / Account Profile dropdown with quick settings and sign-out.

***

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Data Partitioning via `shopId` Field vs Separate Subcollections
- **Chosen Approach**: Every document in root collections (`mobiles`, `sales`, `bills`, `khata`, `khataTransactions`, `expenses`) contains a mandatory `shopId` string field matching the owner's shop identifier. Queries use `where('shopId', '==', currentShopId)`.
- **Why**: Keeps database indexing simple, allows fast cross-collection aggregation for dashboard metrics, supports easy single-shop data exports, and avoids complex deep-nested subcollection path management.
- **Alternatives Considered**: Subcollections under `/shops/{shopId}/mobiles` were considered, but would require complex composite index rules, breaking existing query tools and complicating collection group backups.

### Decision 2: Legacy Arshad Mobile Zone Migration & Protection
- **Chosen Approach**: 
  - An automated fallback and claim utility identifies any document without a `shopId` or `userId`.
  - For the primary Arshad Mobile Zone owner account (`threadsandtailsshop@gmail.com`), the application queries documents where `shopId == 'arshad-mobile-zone'` OR `userId == uid` OR documents that are unassigned legacy records.
  - An optional one-click *"Assign Historical Records to Arshad Mobile Zone"* routine will stamp `shopId: 'arshad-mobile-zone'` onto legacy records so rules can enforce 100% strict ABAC security without any data disappearing.

### Decision 3: Dynamic Monogram Avatar Generator
- **Chosen Approach**: A client-side SVG and Canvas avatar engine extracts initials from the shop name (e.g. "Usman Afridi" -> "UA", "Arshad Mobile Zone" -> "AMZ"). It outputs both a vector component for in-app UI and a data-URL/PNG for POS thermal bills and mobile favicon/PWA manifest injection.
- **Why**: Eliminates the need for shopkeepers to hire graphic designers or upload external image files that could fail to load. If a custom logo URL is uploaded in settings, it seamlessly overrides the initials badge.

### Decision 4: Google Workspace OAuth for Google Drive Backups
- **Chosen Approach**: Use Google Workspace OAuth with scope `https://www.googleapis.com/auth/drive.file` using client-side Firebase Auth credentials.
- **Why**: `drive.file` grants least-privilege permission strictly to files created by the application itself (cannot view or alter unrelated personal Drive files). Each shop gets a dedicated JSON backup updated on demand or on a scheduled interval.

***

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Vite SPA (Single Codebase)                      │
│                                                                        │
│  ┌────────────────────────┐             ┌───────────────────────────┐  │
│  │   Auth & Shop Context  │             │   Dynamic Branding Engine │  │
│  │ - Current User (Auth)  │ ──────────> │ - Monogram Generator (UA) │  │
│  │ - Active Shop Profile  │             │ - Custom Theme & Headers  │  │
│  │ - Multi-Tenant Scoping │             │ - Print & Slip Formatter  │  │
│  └───────────┬────────────┘             └─────────────┬─────────────┘  │
│              │                                        │                │
│              ▼                                        ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Scoped Application Pages & Views                 │  │
│  │  - Dashboard       - Inventory & Purchase     - Quick Sales      │  │
│  │  - Bills History   - Khata Customer Ledger    - Expenses & P&L   │  │
│  │  - Shop Settings (Name, Phone, Address, Terms, Monogram Preview) │  │
│  └───────────┬────────────────────────────────────────┬─────────────┘  │
└──────────────┼────────────────────────────────────────┼────────────────┘
               │                                        │
               │ queries where('shopId', '==', shopId)  │ Google Drive API
               ▼                                        ▼
┌──────────────────────────────┐        ┌────────────────────────────────┐
│   Single Firestore Project   │        │   Shopkeeper Google Drive      │
│  - /shops/{shopId}           │        │   - [ShopName]_Backup.json     │
│  - /mobiles (shopId)         │        │   (isolated per user drive)    │
│  - /sales (shopId)           │        └────────────────────────────────┘
│  - /bills (shopId)           │
│  - /khata (shopId)           │
│  - /khataTransactions        │
│  - /expenses (shopId)        │
└──────────────────────────────┘
```

### Data Model & Entity Specifications

```typescript
// /shops/{shopId}
interface ShopProfile {
  shopId: string;           // Unique Shop ID (matches owner UID or slug)
  ownerUid: string;         // Firebase Auth UID
  ownerEmail: string;       // Owner Google/Email address
  shopName: string;         // e.g. "Usman Afridi Mobile Center"
  shortName: string;        // e.g. "UA" or "AMZ"
  ownerName: string;        // e.g. "Usman Afridi"
  phone: string;            // Primary phone / WhatsApp (e.g. "0300-1234567")
  secondaryPhone?: string;  // Optional alternate phone
  address: string;          // Shop location / market
  subTitle?: string;        // City / Market subtitle
  receiptNote?: string;     // Custom print bill footer disclaimer
  logoUrl?: string;         // Optional custom logo override
  createdAt: any;
  updatedAt: any;
}

// Scoped Document Interface (added to mobiles, sales, bills, khata, expenses)
interface ScopedRecord {
  shopId: string;           // Indexed partition key
  userId: string;           // Creator / Owner UID
  userEmail?: string;       // Owner Email
}
```

### Phased Execution Roadmap

1. **Step 1: Multi-Tenant Architecture & Shop Context**
   - Enhance `AuthContext` and `multiTenantService` to guarantee that every logged-in user has an active `shopProfile` and `currentShopId`.
   - Provide seamless automatic defaults: if user is `threadsandtailsshop@gmail.com` or has existing store data, default to Arshad Mobile Zone (`arshad-mobile-zone`).

2. **Step 2: Dynamic Branding & Monogram Engine**
   - Build a lightweight monogram utility that parses shop names into 2-3 letter initials with consistent color generation.
   - Update `Navbar`, `Sidebar`, `App.tsx`, and print templates (`BillModal`, `ReceiptPrinter`) to use the active shop's branding and monogram badge.
   - Dynamically update the browser tab title and favicon to reflect the active shop name.

3. **Step 3: Comprehensive Settings & Shop Customization**
   - Expand `SettingsPage` with full shop customization controls: Shop Name, Short Tag / Initials, Owner Name, Contact Numbers, Address, Receipt Footer Text, and WhatsApp notification templates.
   - Add a live interactive preview of how the branding appears on receipts and customer WhatsApp notifications.

4. **Step 4: Scoped Data Layer & Zero Data Loss Guarantee**
   - Update Firestore operations across all pages (`MobilesStockPage`, `PurchaseMobilePage`, `QuickSalePage`, `MobileSalesPage`, `BillsHistoryPage`, `KhataPage`, `CustomerLedgerPage`, `ExpensesPage`, `InventoryValuationPage`) to include `shopId` on all creates and query by `shopId`.
   - Implement transparent fallback queries: if querying for Arshad Mobile Zone, automatically include legacy unassigned records so no historical data is hidden.

5. **Step 5: Google Drive Backup Integration**
   - Configure Google Workspace OAuth with `drive.file` scope using `set_up_oauth`.
   - Implement the backup generator that serializes the current shop's data into a structured JSON file and saves/syncs it directly into the user's personal Google Drive.
