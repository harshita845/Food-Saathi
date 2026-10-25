import React, { useState } from 'react';
import { getMediaUrl } from '@/shared/utils/media.js';
import defaultOffersImg from '@food/assets/explore more icons/offers.png';
import defaultGourmetImg from '@food/assets/explore more icons/gourmet.png';
import defaultCollectionImg from '@food/assets/explore more icons/collection.png';

/**
 * 3D Aesthetic SVG Illustrations for Explore More
 * Designed with rich gradients, specular reflections, depth, and micro-shadows.
 */

export const OffersAestheticIcon = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      {/* Box Gradients */}
      <linearGradient id="offersBox" x1="20" y1="50" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF6B4A" />
        <stop offset="50%" stopColor="#F2541B" />
        <stop offset="100%" stopColor="#C93607" />
      </linearGradient>
      <linearGradient id="offersLid" x1="15" y1="40" x2="105" y2="55" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF8566" />
        <stop offset="100%" stopColor="#E03A04" />
      </linearGradient>
      <linearGradient id="offersGoldRibbon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF2A3" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="offersCoin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="40%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      {/* Glow Filter */}
      <filter id="offersGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#C93607" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Ambient Floor Shadow */}
    <ellipse cx="60" cy="104" rx="38" ry="8" fill="#F2541B" fillOpacity="0.2" />
    <ellipse cx="60" cy="103" rx="28" ry="5" fill="#3D1405" fillOpacity="0.25" />

    {/* Main Gift Box Body */}
    <g filter="url(#softShadow)">
      <rect x="25" y="52" width="70" height="46" rx="10" fill="url(#offersBox)" />
      {/* Box Front Face Highlight */}
      <path d="M27 54C27 54 45 52 60 52C75 52 93 54 93 54V60C93 60 75 58 60 58C45 58 27 60 27 60V54Z" fill="white" fillOpacity="0.25" />

      {/* Vertical Ribbon on Box */}
      <rect x="52" y="52" width="16" height="46" fill="url(#offersGoldRibbon)" />
      <rect x="54" y="52" width="3" height="46" fill="white" fillOpacity="0.4" />

      {/* Gift Box Lid */}
      <rect x="20" y="42" width="80" height="15" rx="6" fill="url(#offersLid)" />
      <rect x="21" y="43" width="78" height="3" rx="1.5" fill="white" fillOpacity="0.45" />

      {/* Vertical Ribbon on Lid */}
      <rect x="51" y="42" width="18" height="15" rx="2" fill="url(#offersGoldRibbon)" />
      <rect x="53" y="42" width="3" height="15" fill="white" fillOpacity="0.4" />
    </g>

    {/* 3D Bow Ties on Top */}
    <g filter="url(#offersGlow)">
      {/* Left Bow Loop */}
      <path d="M57 42C52 32 36 28 36 37C36 44 48 43 57 42Z" fill="url(#offersGoldRibbon)" />
      <path d="M54 41C50 34 40 32 40 37C40 41 48 41 54 41Z" fill="#78350F" fillOpacity="0.25" />
      <path d="M42 33C46 32 52 35 55 40" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

      {/* Right Bow Loop */}
      <path d="M63 42C68 32 84 28 84 37C84 44 72 43 63 42Z" fill="url(#offersGoldRibbon)" />
      <path d="M66 41C70 34 80 32 80 37C80 41 72 41 66 41Z" fill="#78350F" fillOpacity="0.25" />
      <path d="M78 33C74 32 68 35 65 40" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

      {/* Center Bow Knot */}
      <circle cx="60" cy="42" r="5" fill="url(#offersGoldRibbon)" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="58.5" cy="40.5" r="1.5" fill="white" fillOpacity="0.8" />
    </g>

    {/* Floating 3D Discount Coin */}
    <g filter="url(#softShadow)">
      <circle cx="88" cy="42" r="15" fill="url(#offersCoin)" stroke="#D97706" strokeWidth="1.5" />
      <circle cx="88" cy="42" r="12" stroke="#FFFBEB" strokeWidth="1" strokeDasharray="2 1.5" strokeOpacity="0.7" />
      {/* Percent Symbol */}
      <text x="88" y="47" textAnchor="middle" fill="#78350F" fontSize="13" fontWeight="900" fontFamily="sans-serif">
        %
      </text>
      {/* Coin Specular Glint */}
      <path d="M80 35C83 31 92 30 96 35" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
    </g>

    {/* Sparkling Accent Stars */}
    <g filter="url(#offersGlow)">
      <path d="M22 28L24 33L29 35L24 37L22 42L20 37L15 35L20 33L22 28Z" fill="#FFC93C" />
      <circle cx="22" cy="35" r="1.5" fill="white" />

      <path d="M98 72L99.5 75L103 76L99.5 77L98 80L96.5 77L93 76L96.5 75L98 72Z" fill="#FFC93C" />
      <circle cx="98" cy="76" r="1" fill="white" />
    </g>
  </svg>
);

export const GourmetAestheticIcon = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      {/* Cloche Gradients */}
      <linearGradient id="gourmetDome" x1="25" y1="30" x2="95" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="35%" stopColor="#FDE68A" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="gourmetTray" x1="10" y1="75" x2="110" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#E2E8F0" />
        <stop offset="85%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      <linearGradient id="gourmetGoldAccent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF2A3" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      {/* Shadow & Glow */}
      <filter id="gourmetShadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#B45309" floodOpacity="0.3" />
      </filter>
      <filter id="gourmetGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Ambient Floor Shadow */}
    <ellipse cx="60" cy="100" rx="44" ry="7" fill="#64748B" fillOpacity="0.25" />
    <ellipse cx="60" cy="99" rx="34" ry="4.5" fill="#334155" fillOpacity="0.3" />

    {/* Gourmet Serving Tray / Plate */}
    <g filter="url(#gourmetShadow)">
      {/* Lower Rim */}
      <path d="M12 85C12 79 33 75 60 75C87 75 108 79 108 85C108 90 87 95 60 95C33 95 12 90 12 85Z" fill="url(#gourmetTray)" stroke="#CBD5E1" strokeWidth="1" />
      <ellipse cx="60" cy="85" rx="46" ry="7.5" fill="#F8FAFC" />
      <ellipse cx="60" cy="84" rx="43" ry="5.5" fill="none" stroke="url(#gourmetGoldAccent)" strokeWidth="1.2" />
    </g>

    {/* Serving Cloche Dome */}
    <g filter="url(#gourmetShadow)">
      <path
        d="M26 80C26 50 41 36 60 36C79 36 94 50 94 80C94 82 85 83 60 83C35 83 26 82 26 80Z"
        fill="url(#gourmetDome)"
        stroke="#92400E"
        strokeWidth="1"
      />
      {/* Specular Curved Highlight on Dome */}
      <path
        d="M34 74C34 53 45 42 58 40"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
      <path
        d="M37 70C37 55 45 46 54 44"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />

      {/* Cloche Dome Rim Lip */}
      <path d="M23 79C23 77 39 75 60 75C81 75 97 77 97 79C97 81 81 83 60 83C39 83 23 81 23 79Z" fill="url(#gourmetGoldAccent)" />
      <ellipse cx="60" cy="79" rx="37" ry="2" fill="white" fillOpacity="0.45" />

      {/* Top Handle Knob */}
      <circle cx="60" cy="34" r="6.5" fill="url(#gourmetGoldAccent)" stroke="#78350F" strokeWidth="1" />
      <circle cx="58" cy="32" r="2" fill="white" fillOpacity="0.8" />
    </g>

    {/* Floating Golden Michelin Stars */}
    <g filter="url(#gourmetGlow)">
      {/* Center Top Crown Star */}
      <path d="M60 14L62.5 21L70 21L64 25.5L66.5 32.5L60 28L53.5 32.5L56 25.5L50 21L57.5 21L60 14Z" fill="#FBBF24" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="60" cy="23" r="2" fill="#FFFBEB" />

      {/* Left Small Star */}
      <path d="M22 45L23.5 49L27 49L24 51.5L25.5 55.5L22 53L18.5 55.5L20 51.5L17 49L20.5 49L22 45Z" fill="#FBBF24" />

      {/* Right Sparkle */}
      <path d="M98 38L99.5 42L103 43L99.5 44L98 48L96.5 44L93 43L96.5 42L98 38Z" fill="#FDE68A" />
      <circle cx="98" cy="43" r="1" fill="white" />
    </g>
  </svg>
);

export const CollectionsAestheticIcon = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      {/* Binder / Card Gradients */}
      <linearGradient id="colCardBack" x1="20" y1="30" x2="85" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="colCardFront" x1="30" y1="20" x2="95" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2DD4BF" />
        <stop offset="45%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
      <linearGradient id="colGoldRibbon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF2A3" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="colHeart" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDA4AF" />
        <stop offset="50%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#BE123C" />
      </linearGradient>
      {/* Shadows */}
      <filter id="colShadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#0F766E" floodOpacity="0.35" />
      </filter>
      <filter id="colGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Ambient Floor Shadow */}
    <ellipse cx="60" cy="102" rx="40" ry="7" fill="#0D9488" fillOpacity="0.22" />
    <ellipse cx="60" cy="101" rx="28" ry="4.5" fill="#042F2E" fillOpacity="0.25" />

    {/* Background Recipe Binder / Collection Card */}
    <g filter="url(#colShadow)">
      <rect x="22" y="32" width="60" height="66" rx="9" transform="rotate(-8 22 32)" fill="url(#colCardBack)" stroke="#7DD3FC" strokeWidth="1" />
      {/* Gold Foil Accent Line */}
      <rect x="27" y="38" width="50" height="3" rx="1.5" transform="rotate(-8 27 38)" fill="white" fillOpacity="0.35" />
    </g>

    {/* Main Foreground Collection Card */}
    <g filter="url(#colShadow)">
      <rect x="36" y="24" width="62" height="72" rx="10" fill="url(#colCardFront)" stroke="#99F6E4" strokeWidth="1.2" />

      {/* Embossed Card Highlights */}
      <path d="M38 27C38 27 60 25 80 25C90 25 96 27 96 27" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.55" />

      {/* Decorative Food / Star Icon on Card Front */}
      <rect x="46" y="36" width="42" height="28" rx="6" fill="#134E4A" fillOpacity="0.45" />
      <circle cx="67" cy="50" r="8" fill="#CCFBF1" fillOpacity="0.3" />
      <circle cx="67" cy="50" r="5" fill="#FBBF24" />

      {/* Content Mock Lines */}
      <rect x="46" y="70" width="30" height="3" rx="1.5" fill="white" fillOpacity="0.4" />
      <rect x="46" y="77" width="22" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
      <rect x="46" y="84" width="36" height="3" rx="1.5" fill="white" fillOpacity="0.35" />
    </g>

    {/* Floating Golden Bookmark Ribbon hanging down */}
    <g filter="url(#colShadow)">
      <path d="M74 20V48L80.5 42L87 48V20H74Z" fill="url(#colGoldRibbon)" stroke="#B45309" strokeWidth="0.8" />
      <path d="M76 21V43L80.5 38.5L85 43V21H76Z" fill="#FEF3C7" fillOpacity="0.4" />
    </g>

    {/* Floating 3D Favorite Heart Badge */}
    <g filter="url(#colGlow)">
      <circle cx="95" cy="75" r="14" fill="url(#colHeart)" stroke="white" strokeWidth="1.8" />
      {/* Heart Shape */}
      <path
        d="M95 82C95 82 87 77.5 87 72C87 69.5 89 67.5 91.5 67.5C93 67.5 94.3 68.3 95 69.2C95.7 68.3 97 67.5 98.5 67.5C101 67.5 103 69.5 103 72C103 77.5 95 82 95 82Z"
        fill="white"
      />
      <circle cx="91" cy="69" r="1" fill="white" fillOpacity="0.9" />
    </g>

    {/* Floating Accent Sparkles */}
    <g filter="url(#colGlow)">
      <path d="M22 22L24 26L28 27L24 28L22 32L20 28L16 27L20 26L22 22Z" fill="#FBBF24" />
      <circle cx="22" cy="27" r="1.2" fill="white" />
    </g>
  </svg>
);

/**
 * Universal Interactive Explore Icon Component
 * Seamlessly resolves custom images, fallbacks, and premium 3D aesthetic vector graphics.
 */
export default function InteractiveExploreIcon({
  label = "",
  image = "",
  fallbackImage = "",
  className = "w-full h-full",
  alt = "",
  forceVector = false
}) {
  const [imgError, setImgError] = useState(false);
  const normalizedLabel = String(label || "").trim().toLowerCase();

  // Determine static 3D bundled asset based on label
  const getStaticAsset = () => {
    if (normalizedLabel.includes("offer") || normalizedLabel.includes("deal") || normalizedLabel.includes("discount")) {
      return defaultOffersImg;
    }
    if (normalizedLabel.includes("gourmet") || normalizedLabel.includes("chef") || normalizedLabel.includes("fine") || normalizedLabel.includes("premium")) {
      return defaultGourmetImg;
    }
    if (normalizedLabel.includes("collect") || normalizedLabel.includes("favorite") || normalizedLabel.includes("curat")) {
      return defaultCollectionImg;
    }
    return null;
  };

  const staticAsset = getStaticAsset();

  // If dynamic image provided, resolve via getMediaUrl; otherwise use static 3D asset
  let resolvedSrc = "";
  if (!imgError && !forceVector) {
    if (image && typeof image === 'string' && image.trim()) {
      resolvedSrc = getMediaUrl(image.trim());
    } else if (staticAsset) {
      resolvedSrc = staticAsset;
    }
  }

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt || label || "Explore"}
        className={`${className} object-contain transition-transform duration-300`}
        loading="eager"
        onError={() => {
          if (staticAsset && resolvedSrc !== staticAsset) {
            setImgError(false);
          } else {
            setImgError(true);
          }
        }}
      />
    );
  }

  // Guaranteed aesthetic vector fallback based on label keyword
  if (normalizedLabel.includes("offer") || normalizedLabel.includes("discount") || normalizedLabel.includes("deal")) {
    return <OffersAestheticIcon className={className} />;
  }

  if (normalizedLabel.includes("gourmet") || normalizedLabel.includes("fine") || normalizedLabel.includes("chef") || normalizedLabel.includes("premium")) {
    return <GourmetAestheticIcon className={className} />;
  }

  if (normalizedLabel.includes("collect") || normalizedLabel.includes("favorite") || normalizedLabel.includes("curat")) {
    return <CollectionsAestheticIcon className={className} />;
  }

  // Default aesthetic fallback
  return <OffersAestheticIcon className={className} />;
}
