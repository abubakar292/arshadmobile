import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SHOP_CONFIG } from '../config/shopConfig';

interface AppLoaderProps {
  isLoading: boolean;
}

export default function AppLoader({ isLoading }: AppLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftBracketRef = useRef<SVGPathElement>(null);
  const rightBracketRef = useRef<SVGPathElement>(null);
  const outerRingRef = useRef<SVGCircleElement>(null);
  const innerRingRef = useRef<SVGCircleElement>(null);
  const goldRingRef = useRef<SVGCircleElement>(null);
  const letterARef = useRef<SVGTextElement>(null);
  const letterMRef = useRef<SVGTextElement>(null);
  const letterZRef = useRef<SVGTextElement>(null);
  const topTextRef = useRef<SVGTextElement>(null);
  const bottomTextRef = useRef<SVGTextElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const glowBurstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) return;

    const ctx = gsap.context(() => {
      // Continuous background glow pulse
      gsap.to('.loader-glow-orb', {
        scale: 1.25,
        opacity: 0.6,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        stagger: 0.4,
      });

      // Infinite slow spin on golden tech ring
      if (goldRingRef.current) {
        gsap.to(goldRingRef.current, {
          rotation: 360,
          transformOrigin: '256px 256px',
          duration: 8,
          repeat: -1,
          ease: 'none',
        });
      }

      // Master Assemble & Disassemble Timeline
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      // Step 0: Initial exploded state
      tl.set([letterARef.current, letterMRef.current, letterZRef.current], {
        opacity: 0,
        scale: 0.2,
      })
      .set(letterARef.current, { x: -80, y: -40, rotation: -45 })
      .set(letterMRef.current, { y: 60, rotation: 15 })
      .set(letterZRef.current, { x: 80, y: -40, rotation: 45 })
      .set(leftBracketRef.current, { x: -70, opacity: 0, transformOrigin: 'center' })
      .set(rightBracketRef.current, { x: 70, opacity: 0, transformOrigin: 'center' })
      .set(outerRingRef.current, { scale: 0.7, opacity: 0, transformOrigin: '256px 256px' })
      .set(innerRingRef.current, { scale: 0, opacity: 0, transformOrigin: '256px 256px' })
      .set([topTextRef.current, bottomTextRef.current], { opacity: 0, scale: 0.8, transformOrigin: '256px 256px' })
      .set(subtitleRef.current, { opacity: 0, y: 15 })
      .set(progressBarRef.current, { width: '0%' })

      // Step 1: Rings Expand and Outer Brackets Fly In (Assemble Phase)
      .to(outerRingRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
      })
      .to([leftBracketRef.current, rightBracketRef.current], {
        x: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
      }, '-=0.3')
      .to(innerRingRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.75)',
      }, '-=0.4')

      // Step 2: AMZ Letters Slam Together and Assemble
      .to(letterARef.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(2)',
      }, '-=0.2')
      .to(letterMRef.current, {
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(2)',
      }, '-=0.5')
      .to(letterZRef.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'back.out(2)',
      }, '-=0.5')

      // Step 3: Impact Flash / Gold Burst
      .to(glowBurstRef.current, {
        opacity: 0.8,
        scale: 1.4,
        duration: 0.2,
        ease: 'power2.out',
      }, '-=0.2')
      .to(glowBurstRef.current, {
        opacity: 0,
        scale: 2,
        duration: 0.4,
        ease: 'power2.in',
      })

      // Step 4: Text Arcs Lock and Subtitle Reveals
      .to([topTextRef.current, bottomTextRef.current], {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      }, '-=0.3')
      .to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      }, '-=0.2')
      .to(progressBarRef.current, {
        width: '100%',
        duration: 1.4,
        ease: 'power2.inOut',
      }, '-=0.4')

      // Step 5: Pause to admire the assembled badge
      .to({}, { duration: 1 })

      // Step 6: De-assemble / Disassemble Transition
      .to(subtitleRef.current, { opacity: 0, y: -10, duration: 0.3 })
      .to([topTextRef.current, bottomTextRef.current], { opacity: 0, scale: 1.1, duration: 0.3 }, '-=0.2')
      .to(letterARef.current, { x: -70, y: -40, rotation: -30, opacity: 0, duration: 0.5, ease: 'power2.in' }, '-=0.1')
      .to(letterMRef.current, { y: 50, rotation: 10, opacity: 0, duration: 0.5, ease: 'power2.in' }, '-=0.4')
      .to(letterZRef.current, { x: 70, y: -40, rotation: 30, opacity: 0, duration: 0.5, ease: 'power2.in' }, '-=0.4')
      .to([leftBracketRef.current, rightBracketRef.current], {
        x: (i) => (i === 0 ? -60 : 60),
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      }, '-=0.3')
      .to([outerRingRef.current, innerRingRef.current], {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
      }, '-=0.2');

    }, containerRef);

    return () => ctx.revert();
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #161922 0%, #0F1117 60%, #07080B 100%)',
      }}
    >
      {/* Background Animated Ambient Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="loader-glow-orb absolute top-1/3 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="loader-glow-orb absolute bottom-1/3 right-1/3 w-96 h-96 bg-gold-600/10 rounded-full blur-[120px]" />
        <div className="loader-glow-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full blur-[80px]" />
      </div>

      {/* Center Gold Burst Flash */}
      <div
        ref={glowBurstRef}
        className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-amber-400 via-gold to-yellow-200 pointer-events-none opacity-0 blur-2xl -translate-y-6"
      />

      {/* SVG Emblem for GSAP Assemble / De-Assemble */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-6">
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full drop-shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
        >
          <defs>
            <path id="loader-top-arc" d="M 68 256 A 188 188 0 0 1 444 256" fill="none" />
            <path id="loader-bottom-arc" d="M 444 256 A 188 188 0 0 1 68 256" fill="none" />
            <linearGradient id="loader-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Crisp White Inner Disc */}
          <circle cx="256" cy="256" r="248" fill="#FFFFFF" />

          {/* Outer Ring */}
          <circle
            ref={outerRingRef}
            cx="256"
            cy="256"
            r="215"
            fill="none"
            stroke="#12141D"
            strokeWidth="26"
          />

          {/* Left Bracket / Shutter Segment */}
          <g ref={leftBracketRef}>
            <path
              d="M 74 200 A 186 186 0 0 0 74 312 L 56 312 A 204 204 0 0 1 56 200 Z"
              fill="#E2E8F0"
              stroke="#12141D"
              strokeWidth="4"
            />
            <rect x="52" y="248" width="28" height="16" fill="#12141D" />
            <line x1="52" y1="252" x2="80" y2="252" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="52" y1="260" x2="80" y2="260" stroke="#FFFFFF" strokeWidth="2" />
          </g>

          {/* Right Bracket / Shutter Segment */}
          <g ref={rightBracketRef}>
            <path
              d="M 438 200 A 186 186 0 0 1 438 312 L 456 312 A 204 204 0 0 0 456 200 Z"
              fill="#E2E8F0"
              stroke="#12141D"
              strokeWidth="4"
            />
            <rect x="432" y="248" width="28" height="16" fill="#12141D" />
            <line x1="432" y1="252" x2="460" y2="252" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="432" y1="260" x2="460" y2="260" stroke="#FFFFFF" strokeWidth="2" />
          </g>

          {/* Top Arc Text */}
          <text
            ref={topTextRef}
            fontFamily="'Inter', sans-serif"
            fontSize="23"
            fontWeight="900"
            fill="#12141D"
            letterSpacing="4"
            textAnchor="middle"
          >
            <textPath href="#loader-top-arc" startOffset="50%" textAnchor="middle">
              ARSHAD MOBILE ZONE
            </textPath>
          </text>

          {/* Bottom Arc Text */}
          <text
            ref={bottomTextRef}
            fontFamily="'Inter', sans-serif"
            fontSize="22"
            fontWeight="900"
            fill="#12141D"
            letterSpacing="4"
            textAnchor="middle"
          >
            <textPath href="#loader-bottom-arc" startOffset="50%" textAnchor="middle">
              BARA BAZAR KHYBER
            </textPath>
          </text>

          {/* Inner Black Ring */}
          <circle
            ref={innerRingRef}
            cx="256"
            cy="256"
            r="148"
            fill="none"
            stroke="#12141D"
            strokeWidth="12"
          />

          {/* Rotating Tech Golden Dashed Ring */}
          <circle
            ref={goldRingRef}
            cx="256"
            cy="256"
            r="138"
            fill="none"
            stroke="url(#loader-gold-grad)"
            strokeWidth="3.5"
            strokeDasharray="10 6"
          />

          {/* Center Disassembled / Assembled AMZ Letters */}
          <g>
            <text
              ref={letterARef}
              x="195"
              y="286"
              fontFamily="'Inter', sans-serif"
              fontSize="96"
              fontWeight="900"
              fill="#12141D"
              textAnchor="middle"
            >
              A
            </text>
            <text
              ref={letterMRef}
              x="256"
              y="286"
              fontFamily="'Inter', sans-serif"
              fontSize="96"
              fontWeight="900"
              fill="#12141D"
              textAnchor="middle"
            >
              M
            </text>
            <text
              ref={letterZRef}
              x="317"
              y="286"
              fontFamily="'Inter', sans-serif"
              fontSize="96"
              fontWeight="900"
              fill="#12141D"
              textAnchor="middle"
            >
              Z
            </text>
          </g>
        </svg>
      </div>

      {/* Subtitle & Shop Identity */}
      <div ref={subtitleRef} className="text-center z-10 px-4 mb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          {SHOP_CONFIG.name}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <span className="h-[1px] w-6 bg-gold/50" />
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-gold uppercase">
            {SHOP_CONFIG.subTitle}
          </p>
          <span className="h-[1px] w-6 bg-gold/50" />
        </div>
      </div>

      {/* High-Tech Progress Bar */}
      <div className="w-56 sm:w-64 h-1.5 bg-white/10 rounded-full overflow-hidden z-10 border border-white/5 p-[1px]">
        <div
          ref={progressBarRef}
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-gold to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
        />
      </div>

      {/* Subtle Status */}
      <p className="mt-3 text-[11px] text-gray-400 font-medium tracking-wider uppercase">
        Initializing Shop Engine...
      </p>
    </div>
  );
}
