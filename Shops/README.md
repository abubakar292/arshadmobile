# Shops Multi-Tenant Architecture

This directory houses independent shop installations.

## Existing Shops
- **ArshadMobileZone** (`/Shops/ArshadMobileZone`)
  - Primary shop for Arshad Mobile Zone (AMZ)
  - Connects to Firestore with full backward compatibility
  - All existing owner data uploaded via Google Sign-In or email is preserved and visible.

## How to Duplicate for a New Shop Order
When you receive a new shop order:
1. Duplicate the `ArshadMobileZone` folder:
   `cp -r Shops/ArshadMobileZone Shops/NewShopName`
2. Update `Shops/NewShopName/shop.config.json` and `Shops/NewShopName/src/config/shopConfig.ts` with the new shop's:
   - `shopId` (e.g., `new-shop-name`)
   - `name` (e.g., `New Mobile Point`)
   - `shortName` (e.g., `NMP`)
   - `phone`
   - `address`
   - `logoUrl` / icon
3. Each shop manages its own branding, assets, and data in Firestore partitioned cleanly by `shopId`.
