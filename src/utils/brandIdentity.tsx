import React from 'react';

/**
 * Extracts clean, punchy 2-3 character initials from a shop or brand name.
 * Examples:
 * - "Usman Afridi" -> "UA"
 * - "Arshad Mobile Zone" -> "AMZ"
 * - "Zamzam Mobile Center" -> "ZMC"
 * - "Mobile Hub" -> "MH"
 * - "Samsung" -> "SA"
 */
export function getInitials(name: string, maxChars = 3): string {
  if (!name || !name.trim()) return 'MZ';

  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'MZ';
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  // 3 or more words
  if (maxChars >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Deterministically generates an elegant, high-contrast gradient palette
 * based on the shop name or initials so every shop feels uniquely tailored.
 */
export function getBrandGradient(name: string): { from: string; to: string; text: string; ring: string } {
  const gradients = [
    { from: '#F59E0B', to: '#D97706', text: '#FFFFFF', ring: 'ring-amber-500/30' },       // Signature Gold / Amber
    { from: '#1E2230', to: '#12141D', text: '#F59E0B', ring: 'ring-amber-500/30' },       // Obsidian & Gold
    { from: '#D97706', to: '#92400E', text: '#FFFFFF', ring: 'ring-amber-600/30' },       // Deep Warm Amber
    { from: '#FBBF24', to: '#D97706', text: '#0B0C10', ring: 'ring-amber-400/30' },       // Bright Honey Gold
    { from: '#0F172A', to: '#0B0C10', text: '#FCD34D', ring: 'ring-amber-400/30' },       // Deep Obsidian Gold
    { from: '#B45309', to: '#78350F', text: '#FEF3C7', ring: 'ring-amber-700/30' },       // Heritage Warm Amber
  ];

  if (!name) return gradients[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * Generates an in-memory PNG Data URL of the monogram icon for use as
 * dynamic browser favicon, Apple touch icon, and print headers.
 */
export function generateMonogramDataUrl(initials: string, size = 128, nameForColor?: string): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const palette = getBrandGradient(nameForColor || initials);

  // Draw rounded background
  const radius = size * 0.24;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, palette.from);
  grad.addColorStop(1, palette.to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle inner border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = size * 0.04;
  ctx.stroke();

  // Draw Monogram Text
  ctx.fillStyle = palette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Font size scales with character count
  const fontSize = initials.length > 2 ? size * 0.40 : size * 0.48;
  ctx.font = `bold ${Math.round(fontSize)}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(initials, size / 2, size / 2 + size * 0.02);

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * Dynamically updates the browser title, favicon, mobile homescreen apple-touch-icon,
 * and Web App Manifest (PWA install) so the app installs with the shop's custom name and monogram!
 */
let currentManifestUrl: string | null = null;

export function updateAppBranding(shopName: string, shortName?: string): void {
  if (typeof document === 'undefined') return;

  const effectiveName = shopName?.trim() || 'Mobile Shop';
  const initials = shortName?.trim() || getInitials(effectiveName);

  // 1. Update Document Title & OpenGraph
  document.title = effectiveName;

  try {
    // 2. Update Mobile Homescreen App Name Meta Tags (iOS & Android)
    let appleTitle = document.querySelector("meta[name='apple-mobile-web-app-title']") as HTMLMetaElement | null;
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitle);
    }
    appleTitle.content = effectiveName;

    let appNameMeta = document.querySelector("meta[name='application-name']") as HTMLMetaElement | null;
    if (!appNameMeta) {
      appNameMeta = document.createElement('meta');
      appNameMeta.name = 'application-name';
      document.head.appendChild(appNameMeta);
    }
    appNameMeta.content = effectiveName;

    let ogTitle = document.querySelector("meta[property='og:title']") as HTMLMetaElement | null;
    if (ogTitle) ogTitle.content = effectiveName;

    // 3. Generate high-resolution Monogram icons
    const faviconUrl = generateMonogramDataUrl(initials, 64, effectiveName);
    const icon192Url = generateMonogramDataUrl(initials, 192, effectiveName);
    const icon512Url = generateMonogramDataUrl(initials, 512, effectiveName);

    if (!icon192Url) return;

    // 4. Update Favicon
    let favLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!favLink) {
      favLink = document.createElement('link');
      favLink.rel = 'shortcut icon';
      document.head.appendChild(favLink);
    }
    favLink.type = 'image/png';
    favLink.href = faviconUrl;

    // 5. Update Apple Touch Icon (used by iOS "Add to Home Screen")
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = icon192Url;

    let applePrecomposed = document.querySelector("link[rel='apple-touch-icon-precomposed']") as HTMLLinkElement | null;
    if (!applePrecomposed) {
      applePrecomposed = document.createElement('link');
      applePrecomposed.rel = 'apple-touch-icon-precomposed';
      document.head.appendChild(applePrecomposed);
    }
    applePrecomposed.href = icon192Url;

    // 6. Dynamically generate and attach Web App Manifest with the Shop Name and Monogram Icons!
    const dynamicManifest = {
      id: '/',
      name: effectiveName,
      short_name: effectiveName,
      description: `${effectiveName} — Shop Management System`,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0F1117',
      theme_color: '#12141D',
      orientation: 'portrait',
      icons: [
        {
          src: icon192Url,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: icon512Url,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: icon512Url,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    };

    // Release previously generated blob URL to avoid memory leak
    if (currentManifestUrl) {
      try { URL.revokeObjectURL(currentManifestUrl); } catch (e) { /* ignore */ }
    }

    const manifestBlob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/manifest+json' });
    currentManifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = currentManifestUrl;

    // 7. Store in localStorage for instant hydration on subsequent reloads
    try {
      localStorage.setItem('cached_shop_name', effectiveName);
      localStorage.setItem('cached_shop_short_name', initials);
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.warn('Could not update dynamic branding / manifest:', err);
  }
}

/**
 * React Component for rendering the dynamic brand initials badge.
 */
export function ShopBrandBadge({
  name,
  shortName,
  size = 'md',
  className = '',
}: {
  name: string;
  shortName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const initials = shortName || getInitials(name);
  const palette = getBrandGradient(name || initials);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-md',
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-14 h-14 text-base rounded-2xl',
    xl: 'w-20 h-20 text-2xl rounded-2xl shadow-lg',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center font-bold tracking-wider select-none shrink-0 border border-white/20 shadow-sm ${sizeClasses} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        color: palette.text,
      }}
      title={name}
      aria-label={`${name} Logo`}
    >
      <span>{initials}</span>
    </div>
  );
}
