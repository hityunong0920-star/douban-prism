import { useId } from 'react';

/**
 * Dark Side of the Moon inspired wide prism mark for the Hero section.
 * A single beam enters the glass prism and disperses into 4 Douban media bands:
 * 电影 (Emerald), 读书 (Amber), 游戏 (Indigo), 音乐 (Crimson Rose).
 */
export function PrismHeroMark({ className = 'w-64 sm:w-80 h-auto' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 360 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DoubanPrism 三棱镜标志"
      role="img"
    >
      <defs>
        {/* Incoming beam gradient: fades in softly from left */}
        <linearGradient id={`${uid}-beam-in`} x1="16" y1="86" x2="143" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="28%" stopColor="currentColor" stopOpacity="0.65" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.95" />
        </linearGradient>

        {/* Internal light dispersion cone inside the prism */}
        <linearGradient id={`${uid}-internal`} x1="143" y1="64" x2="205" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.34" />
          <stop offset="65%" stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
        </linearGradient>

        {/* Glass prism body subtle fill */}
        <linearGradient id={`${uid}-glass`} x1="172" y1="16" x2="172" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.09" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.03" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
        </linearGradient>

        {/* 4 refracted spectrum bands fading softly on the right edge */}
        <linearGradient id={`${uid}-ray-movie`} x1="195" y1="56" x2="344" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#239358" stopOpacity="0.95" />
          <stop offset="72%" stopColor="#34B872" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#34B872" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-ray-book`} x1="198" y1="61" x2="344" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D18E28" stopOpacity="0.95" />
          <stop offset="72%" stopColor="#E6A83C" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#E6A83C" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-ray-game`} x1="201" y1="66" x2="344" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5266CC" stopOpacity="0.95" />
          <stop offset="72%" stopColor="#7789EB" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#7789EB" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-ray-music`} x1="204" y1="71" x2="344" y2="93" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C84654" stopOpacity="0.95" />
          <stop offset="72%" stopColor="#E26673" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#E26673" stopOpacity="0" />
        </linearGradient>

        {/* Soft glow filter for dark mode feel (subtle enough to look crisp in light mode too) */}
        <filter id={`${uid}-glow`} x="-10%" y="-25%" width="120%" height="150%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Incoming single beam (left -> left prism face) */}
      <line
        x1="16"
        y1="88"
        x2="143.5"
        y2="63.5"
        stroke={`url(#${uid}-beam-in)`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Outgoing 4 refracted spectrum bands (电影 / 读书 / 游戏 / 音乐) */}
      <g filter={`url(#${uid}-glow)`}>
        <polygon points="195.2,54 198.2,59 344,70 344,61" fill={`url(#${uid}-ray-movie)`} />
        <polygon points="198.2,59 201.3,64 344,79 344,70" fill={`url(#${uid}-ray-book)`} />
        <polygon points="201.3,64 204.3,69 344,88 344,79" fill={`url(#${uid}-ray-game)`} />
        <polygon points="204.3,69 207.4,74 344,97 344,88" fill={`url(#${uid}-ray-music)`} />
      </g>

      {/* Prism glass body */}
      <polygon points="172,16 116,108 228,108" fill={`url(#${uid}-glass)`} />

      {/* Internal refracted dispersion cone */}
      <polygon points="143.5,63.5 195.2,54 207.4,74" fill={`url(#${uid}-internal)`} />

      {/* Subtle inner glass bevel line */}
      <polygon
        points="172,22 121.5,104.5 222.5,104.5"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Main crisp prism outline */}
      <polygon
        points="172,16 116,108 228,108"
        stroke="currentColor"
        strokeOpacity="0.88"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />

      {/* Tiny specular highlight dot at entry point */}
      <circle cx="143.5" cy="63.5" r="1.8" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}

/**
 * Compact square prism icon for the top Header bar.
 */
export function PrismIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" fill="#121419" />
      <rect
        x="0.6"
        y="0.6"
        width="38.8"
        height="38.8"
        rx="10.4"
        stroke="#ffffff"
        strokeOpacity="0.12"
        strokeWidth="1.2"
      />
      {/* Incoming white beam */}
      <line x1="3" y1="24.5" x2="15.8" y2="21.2" stroke="#F4F1EA" strokeWidth="1.6" strokeLinecap="round" />

      {/* 4 spectrum rays */}
      <polygon points="23.4,19.4 24.3,20.9 37,22.2 37,19.8" fill="#34B872" />
      <polygon points="24.3,20.9 25.1,22.3 37,24.6 37,22.2" fill="#E6A83C" />
      <polygon points="25.1,22.3 26.0,23.8 37,27.0 37,24.6" fill="#7789EB" />
      <polygon points="26.0,23.8 26.8,25.2 37,29.4 37,27.0" fill="#E26673" />

      {/* Internal light fan */}
      <polygon points="15.8,21.2 23.4,19.4 26.8,25.2" fill="#FFFFFF" fillOpacity="0.22" />

      {/* Prism triangle */}
      <polygon
        points="20,9 10.8,28.5 29.2,28.5"
        fill="#FFFFFF"
        fillOpacity="0.06"
        stroke="#F4F1EA"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
