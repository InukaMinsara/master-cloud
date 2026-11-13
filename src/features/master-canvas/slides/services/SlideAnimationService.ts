import React from 'react';
import { AnimationType, TransitionType } from '../types';

export interface AnimationCatalogItem {
  id: AnimationType;
  label: string;
  category: 'Entrance' | 'Emphasis' | 'Exit' | 'Motion Paths';
  starColor: '#22c55e' | '#eab308' | '#ef4444' | '#3b82f6';
  description: string;
}

export interface TransitionCatalogItem {
  id: TransitionType;
  label: string;
  category: 'Subtle' | 'Exciting' | 'Dynamic Content';
  description: string;
}

export class SlideAnimationService {
  static getAnimationCatalog(): AnimationCatalogItem[] {
    return [
      // ── Entrance (Green Star) ──────────────────────────
      { id: 'appear', label: 'Appear', category: 'Entrance', starColor: '#22c55e', description: 'Instant snap onto slide' },
      { id: 'fade-in', label: 'Fade', category: 'Entrance', starColor: '#22c55e', description: 'Smooth soft dissolve in' },
      { id: 'fly-in-bottom', label: 'Fly In (Bottom)', category: 'Entrance', starColor: '#22c55e', description: 'Flies in from bottom edge' },
      { id: 'fly-in-left', label: 'Fly In (Left)', category: 'Entrance', starColor: '#22c55e', description: 'Flies in from left screen' },
      { id: 'fly-in-right', label: 'Fly In (Right)', category: 'Entrance', starColor: '#22c55e', description: 'Flies in from right screen' },
      { id: 'fly-in-top', label: 'Fly In (Top)', category: 'Entrance', starColor: '#22c55e', description: 'Drops in from top margin' },
      { id: 'float-in', label: 'Float In', category: 'Entrance', starColor: '#22c55e', description: 'Gentle buoyant rise into place' },
      { id: 'split', label: 'Split In', category: 'Entrance', starColor: '#22c55e', description: 'Splits open from center' },
      { id: 'wipe', label: 'Wipe In', category: 'Entrance', starColor: '#22c55e', description: 'Sweeps across like a paint stroke' },
      { id: 'shape-in', label: 'Shape Expand', category: 'Entrance', starColor: '#22c55e', description: 'Expands outwards from geometric core' },
      { id: 'wheel', label: 'Wheel Radial', category: 'Entrance', starColor: '#22c55e', description: 'Clockwise radial spoke reveal' },
      { id: 'zoom-in', label: 'Zoom In', category: 'Entrance', starColor: '#22c55e', description: 'Scales up dynamically from depth' },
      { id: 'bounce', label: 'Bounce', category: 'Entrance', starColor: '#22c55e', description: 'Drops and rebounds with physics' },
      { id: 'swivel', label: 'Swivel', category: 'Entrance', starColor: '#22c55e', description: '3D horizontal coin spin into view' },
      { id: 'grow-turn', label: 'Grow & Turn', category: 'Entrance', starColor: '#22c55e', description: 'Spins while scaling up to 100%' },
      { id: 'elastic', label: 'Elastic Pop', category: 'Entrance', starColor: '#22c55e', description: 'Snappy spring overshoot' },

      // ── Emphasis (Yellow Star) ─────────────────────────
      { id: 'pulse', label: 'Pulse', category: 'Emphasis', starColor: '#eab308', description: 'Heartbeat scale burst' },
      { id: 'color-pulse', label: 'Color Pulse', category: 'Emphasis', starColor: '#eab308', description: 'Vibrant highlight illumination' },
      { id: 'teeter', label: 'Teeter', category: 'Emphasis', starColor: '#eab308', description: 'Side-to-side pendulum wobble' },
      { id: 'spin', label: 'Spin 360°', category: 'Emphasis', starColor: '#eab308', description: 'Full clockwise rotation' },
      { id: 'spin-counter', label: 'Spin Counter', category: 'Emphasis', starColor: '#eab308', description: 'Counter-clockwise rotation' },
      { id: 'grow-shrink', label: 'Grow / Shrink', category: 'Emphasis', starColor: '#eab308', description: 'Temporary magnify and settle' },
      { id: 'wave', label: 'Wave Shake', category: 'Emphasis', starColor: '#eab308', description: 'Horizontal buzz excitation' },
      { id: 'flash', label: 'Flash', category: 'Emphasis', starColor: '#eab308', description: 'High-contrast strobe blink' },
      { id: 'shimmer', label: 'Shimmer', category: 'Emphasis', starColor: '#eab308', description: 'Golden metallic gleam sweep' },
      { id: 'darken', label: 'Darken', category: 'Emphasis', starColor: '#eab308', description: 'Recedes into deeper tint' },
      { id: 'lighten', label: 'Lighten', category: 'Emphasis', starColor: '#eab308', description: 'Brightens with luminescent glow' },
      { id: 'transparency', label: 'Transparency', category: 'Emphasis', starColor: '#eab308', description: 'Fades to 35% ghost opacity' },

      // ── Exit (Red Star) ────────────────────────────────
      { id: 'disappear', label: 'Disappear', category: 'Exit', starColor: '#ef4444', description: 'Instant disappearance' },
      { id: 'fade-out', label: 'Fade Out', category: 'Exit', starColor: '#ef4444', description: 'Soft dissolve into background' },
      { id: 'fly-out-bottom', label: 'Fly Out (Bottom)', category: 'Exit', starColor: '#ef4444', description: 'Drops off screen downward' },
      { id: 'fly-out-left', label: 'Fly Out (Left)', category: 'Exit', starColor: '#ef4444', description: 'Rushes off through left edge' },
      { id: 'fly-out-right', label: 'Fly Out (Right)', category: 'Exit', starColor: '#ef4444', description: 'Rushes off through right edge' },
      { id: 'fly-out-top', label: 'Fly Out (Top)', category: 'Exit', starColor: '#ef4444', description: 'Shoots up off screen' },
      { id: 'float-out', label: 'Float Out', category: 'Exit', starColor: '#ef4444', description: 'Drifts upward into the clouds' },
      { id: 'split-out', label: 'Split Out', category: 'Exit', starColor: '#ef4444', description: 'Collapses inward to center' },
      { id: 'wipe-out', label: 'Wipe Out', category: 'Exit', starColor: '#ef4444', description: 'Linear directional erasure' },
      { id: 'zoom-out', label: 'Zoom Out', category: 'Exit', starColor: '#ef4444', description: 'Shrinks into vanishing point' },
      { id: 'swivel-out', label: 'Swivel Exit', category: 'Exit', starColor: '#ef4444', description: '3D rotation into flat edge' },
      { id: 'bounce-out', label: 'Bounce Out', category: 'Exit', starColor: '#ef4444', description: 'Rebounds downward and exits' },
      { id: 'shrink-turn', label: 'Shrink & Turn', category: 'Exit', starColor: '#ef4444', description: 'Spiral shrink to 0%' },

      // ── Motion Paths (Blue) ────────────────────────────
      { id: 'path-line-down', label: 'Line Down', category: 'Motion Paths', starColor: '#3b82f6', description: 'Translates downward by 120px' },
      { id: 'path-line-right', label: 'Line Right', category: 'Motion Paths', starColor: '#3b82f6', description: 'Translates rightward by 150px' },
      { id: 'path-line-left', label: 'Line Left', category: 'Motion Paths', starColor: '#3b82f6', description: 'Translates leftward by 150px' },
      { id: 'path-line-up', label: 'Line Up', category: 'Motion Paths', starColor: '#3b82f6', description: 'Translates upward by 120px' },
      { id: 'path-arc', label: 'Arc Curve', category: 'Motion Paths', starColor: '#3b82f6', description: 'Parabolic curving trajectory' },
      { id: 'path-loop', label: 'Rollercoaster Loop', category: 'Motion Paths', starColor: '#3b82f6', description: 'Completes a vertical loop' },
    ];
  }

  static getTransitionCatalog(): TransitionCatalogItem[] {
    return [
      // ── Subtle ─────────────────────────────────────────
      { id: 'none', label: 'None', category: 'Subtle', description: 'Instant cut' },
      { id: 'morph', label: 'Morph (Signature)', category: 'Subtle', description: 'Intelligently animates moving objects between slides' },
      { id: 'fade', label: 'Fade', category: 'Subtle', description: 'Smooth cross-fade dissolve' },
      { id: 'slide-left', label: 'Push Left', category: 'Subtle', description: 'Pushes current slide leftward' },
      { id: 'slide-right', label: 'Push Right', category: 'Subtle', description: 'Pushes current slide rightward' },
      { id: 'slide-up', label: 'Push Up', category: 'Subtle', description: 'Pushes current slide upward' },
      { id: 'slide-down', label: 'Push Down', category: 'Subtle', description: 'Pushes current slide downward' },
      { id: 'wipe', label: 'Wipe', category: 'Subtle', description: 'Linear sweep across the canvas' },
      { id: 'split', label: 'Split', category: 'Subtle', description: 'Two halves part to reveal slide' },
      { id: 'reveal', label: 'Reveal', category: 'Subtle', description: 'Top slide pulls back' },
      { id: 'cut', label: 'Cut', category: 'Subtle', description: 'Crisp broadcast transition' },
      { id: 'random-bars', label: 'Random Bars', category: 'Subtle', description: 'Alternating Venetian blind strips' },

      // ── Exciting ───────────────────────────────────────
      { id: 'curtains', label: 'Curtains', category: 'Exciting', description: 'Velvet theater curtains parting' },
      { id: 'wind', label: 'Wind', category: 'Exciting', description: 'Particles blown away in gust' },
      { id: 'prestige', label: 'Prestige', category: 'Exciting', description: 'High-end cinema glow flare' },
      { id: 'fracture', label: 'Fracture', category: 'Exciting', description: 'Slide shatters like crystal glass' },
      { id: 'crush', label: 'Crush', category: 'Exciting', description: 'Paper crumple into a ball' },
      { id: 'peel-off', label: 'Peel Off', category: 'Exciting', description: 'Corner sticker peel' },
      { id: 'page-curl', label: 'Page Curl', category: 'Exciting', description: 'Realistic 3D book page turn' },
      { id: 'airplane', label: 'Origami Airplane', category: 'Exciting', description: 'Folds into paper airplane and flies' },
      { id: 'origami', label: 'Origami Bird', category: 'Exciting', description: 'Geometric folding flap sequence' },
      { id: 'flash', label: 'Camera Flash', category: 'Exciting', description: 'Blinding white photo flash' },
      { id: 'fall-over', label: 'Fall Over', category: 'Exciting', description: 'Domino topple towards camera' },
      { id: 'drape', label: 'Drape', category: 'Exciting', description: 'Silk sheet dropping down' },
      { id: 'flip', label: '3D Flip', category: 'Exciting', description: 'Full 3D card turnover' },
      { id: 'rotate', label: '3D Cube Rotate', category: 'Exciting', description: '3D perspective carousel cube' },
      { id: 'dissolve', label: 'Dissolve', category: 'Exciting', description: 'Fine-grain pixel dispersion' },
      { id: 'zoom', label: 'Zoom Through', category: 'Exciting', description: 'Camera push through portal' },
      { id: 'shape', label: 'Shape Iris', category: 'Exciting', description: 'Expanding iris mask' },

      // ── Dynamic Content ────────────────────────────────
      { id: 'pan', label: 'Pan', category: 'Dynamic Content', description: 'Smooth cinematic camera truck' },
      { id: 'ferris-wheel', label: 'Ferris Wheel', category: 'Dynamic Content', description: 'Rotary wheel rotation' },
      { id: 'conveyor', label: 'Conveyor', category: 'Dynamic Content', description: 'Mechanical belt slide shift' },
      { id: 'orbit', label: 'Orbit', category: 'Dynamic Content', description: 'Planetary 3D curved revolution' },
      { id: 'window', label: 'Window', category: 'Dynamic Content', description: 'Sliding glass pane aperture' },
    ];
  }

  /**
   * CSS Keyframe strings for standalone HTML and web runtime
   */
  static getAnimationKeyframesCss(): string {
    return `
      /* ── ENTRANCE ANIMATIONS ── */
      @keyframes mcFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mcFlyInBottom {
        from { opacity: 0; transform: translateY(140px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mcFlyInLeft {
        from { opacity: 0; transform: translateX(-160px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes mcFlyInRight {
        from { opacity: 0; transform: translateX(160px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes mcFlyInTop {
        from { opacity: 0; transform: translateY(-140px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mcFloatIn {
        from { opacity: 0; transform: translateY(35px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes mcSplitIn {
        from { opacity: 0; clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%); }
        to { opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
      }
      @keyframes mcWipeIn {
        from { opacity: 0; clip-path: inset(0 100% 0 0); }
        to { opacity: 1; clip-path: inset(0 0 0 0); }
      }
      @keyframes mcShapeIn {
        from { opacity: 0; clip-path: circle(0% at 50% 50%); }
        to { opacity: 1; clip-path: circle(100% at 50% 50%); }
      }
      @keyframes mcWheelIn {
        from { opacity: 0; transform: rotate(-90deg) scale(0.6); }
        to { opacity: 1; transform: rotate(0) scale(1); }
      }
      @keyframes mcZoomIn {
        from { opacity: 0; transform: scale(0.2); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes mcBounce {
        0% { opacity: 0; transform: translateY(-120px); }
        60% { opacity: 1; transform: translateY(0); }
        75% { transform: translateY(-18px); }
        90% { transform: translateY(0); }
        95% { transform: translateY(-6px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes mcSwivel {
        from { opacity: 0; transform: perspective(800px) rotateY(180deg) scale(0.8); }
        to { opacity: 1; transform: perspective(800px) rotateY(0deg) scale(1); }
      }
      @keyframes mcGrowTurn {
        from { opacity: 0; transform: scale(0.1) rotate(-180deg); }
        to { opacity: 1; transform: scale(1) rotate(0deg); }
      }
      @keyframes mcElastic {
        0% { opacity: 0; transform: scale(0.3); }
        50% { opacity: 1; transform: scale(1.18); }
        70% { transform: scale(0.92); }
        85% { transform: scale(1.04); }
        100% { opacity: 1; transform: scale(1); }
      }

      /* ── EMPHASIS ANIMATIONS ── */
      @keyframes mcPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); filter: drop-shadow(0 0 12px rgba(234,179,8,0.6)); }
        100% { transform: scale(1); }
      }
      @keyframes mcColorPulse {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.7) saturate(1.8); }
        100% { filter: brightness(1); }
      }
      @keyframes mcTeeter {
        0% { transform: rotate(0deg); }
        20% { transform: rotate(-8deg); }
        40% { transform: rotate(8deg); }
        60% { transform: rotate(-5deg); }
        80% { transform: rotate(5deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes mcSpinClockwise {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes mcSpinCounter {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
      @keyframes mcGrowShrink {
        0% { transform: scale(1); }
        50% { transform: scale(1.24); }
        100% { transform: scale(1); }
      }
      @keyframes mcWave {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-8px); }
        40%, 80% { transform: translateX(8px); }
      }
      @keyframes mcFlash {
        0%, 50%, 100% { opacity: 1; }
        25%, 75% { opacity: 0.15; }
      }
      @keyframes mcShimmer {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.8) drop-shadow(0 0 16px #eab308); }
        100% { filter: brightness(1); }
      }
      @keyframes mcDarken {
        0% { filter: brightness(1); }
        50% { filter: brightness(0.45); }
        100% { filter: brightness(1); }
      }
      @keyframes mcLighten {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.6); }
        100% { filter: brightness(1); }
      }
      @keyframes mcTransparency {
        0% { opacity: 1; }
        50% { opacity: 0.35; }
        100% { opacity: 1; }
      }

      /* ── EXIT ANIMATIONS ── */
      @keyframes mcDisappear {
        from { opacity: 1; }
        to { opacity: 0; visibility: hidden; }
      }
      @keyframes mcFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes mcFlyOutBottom {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(160px); }
      }
      @keyframes mcFlyOutLeft {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-180px); }
      }
      @keyframes mcFlyOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(180px); }
      }
      @keyframes mcFlyOutTop {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-160px); }
      }
      @keyframes mcFloatOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-45px) scale(0.9); }
      }
      @keyframes mcSplitOut {
        from { opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
        to { opacity: 0; clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%); }
      }
      @keyframes mcWipeOut {
        from { opacity: 1; clip-path: inset(0 0 0 0); }
        to { opacity: 0; clip-path: inset(0 0 0 100%); }
      }
      @keyframes mcZoomOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.15); }
      }
      @keyframes mcSwivelOut {
        from { opacity: 1; transform: perspective(800px) rotateY(0deg); }
        to { opacity: 0; transform: perspective(800px) rotateY(90deg); }
      }
      @keyframes mcBounceOut {
        0% { transform: translateY(0); }
        25% { transform: translateY(-24px); }
        100% { opacity: 0; transform: translateY(180px); }
      }
      @keyframes mcShrinkTurn {
        from { opacity: 1; transform: scale(1) rotate(0deg); }
        to { opacity: 0; transform: scale(0.1) rotate(180deg); }
      }

      /* ── MOTION PATHS ── */
      @keyframes mcPathLineDown {
        from { transform: translateY(0); }
        to { transform: translateY(120px); }
      }
      @keyframes mcPathLineRight {
        from { transform: translateX(0); }
        to { transform: translateX(150px); }
      }
      @keyframes mcPathLineLeft {
        from { transform: translateX(0); }
        to { transform: translateX(-150px); }
      }
      @keyframes mcPathLineUp {
        from { transform: translateY(0); }
        to { transform: translateY(-120px); }
      }
      @keyframes mcPathArc {
        0% { transform: translate(0, 0); }
        50% { transform: translate(75px, -60px); }
        100% { transform: translate(150px, 0); }
      }
      @keyframes mcPathLoop {
        0% { transform: translate(0, 0); }
        25% { transform: translate(40px, -70px) rotate(90deg); }
        50% { transform: translate(0px, -110px) rotate(180deg); }
        75% { transform: translate(-40px, -70px) rotate(270deg); }
        100% { transform: translate(0, 0) rotate(360deg); }
      }

      /* ── SLIDE TRANSITIONS ── */
      @keyframes mcSlideTransFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mcSlideTransLeft {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes mcSlideTransRight {
        from { opacity: 0; transform: translateX(-100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes mcSlideTransUp {
        from { opacity: 0; transform: translateY(100%); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mcSlideTransDown {
        from { opacity: 0; transform: translateY(-100%); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mcSlideTransWipe {
        from { clip-path: inset(0 100% 0 0); }
        to { clip-path: inset(0 0 0 0); }
      }
      @keyframes mcSlideTransSplit {
        from { clip-path: inset(0 50% 0 50%); }
        to { clip-path: inset(0 0 0 0); }
      }
      @keyframes mcSlideTransReveal {
        from { opacity: 0; transform: scale(1.1) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes mcSlideTransBars {
        from { opacity: 0; filter: contrast(180%); }
        to { opacity: 1; filter: contrast(100%); }
      }
      @keyframes mcSlideTransMorph {
        0% { opacity: 0.6; filter: blur(4px); transform: scale(0.98); }
        100% { opacity: 1; filter: blur(0px); transform: scale(1); }
      }
      @keyframes mcSlideTransCurtains {
        from { clip-path: polygon(0 0, 0 100%, 100% 100%, 100% 0); transform: scale(0.9); }
        to { clip-path: polygon(0 0, 0 100%, 100% 100%, 100% 0); transform: scale(1); }
      }
      @keyframes mcSlideTransWind {
        from { opacity: 0; transform: translateX(60px) skewX(-14deg); filter: blur(8px); }
        to { opacity: 1; transform: translateX(0) skewX(0); filter: blur(0); }
      }
      @keyframes mcSlideTransPrestige {
        0% { opacity: 0; filter: brightness(2) blur(10px); }
        100% { opacity: 1; filter: brightness(1) blur(0); }
      }
      @keyframes mcSlideTransFracture {
        0% { opacity: 0; transform: scale(1.15) rotate(2deg); filter: contrast(160%); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); filter: contrast(100%); }
      }
      @keyframes mcSlideTransCrush {
        0% { opacity: 0; transform: scale(0.5) rotate(-15deg); filter: blur(6px); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0); }
      }
      @keyframes mcSlideTransPeelOff {
        from { transform-origin: top left; transform: rotate(-8deg) translateX(-40px); opacity: 0; }
        to { transform: rotate(0) translateX(0); opacity: 1; }
      }
      @keyframes mcSlideTransPageCurl {
        from { transform-origin: left center; transform: perspective(1200px) rotateY(-80deg); opacity: 0; }
        to { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
      }
      @keyframes mcSlideTransAirplane {
        from { opacity: 0; transform: translateX(-100px) translateY(80px) rotate(-12deg) scale(0.6); }
        to { opacity: 1; transform: translate(0,0) rotate(0) scale(1); }
      }
      @keyframes mcSlideTransOrigami {
        0% { opacity: 0; transform: perspective(900px) rotateX(90deg) scale(0.7); }
        100% { opacity: 1; transform: perspective(900px) rotateX(0deg) scale(1); }
      }
      @keyframes mcSlideTransFlash {
        0% { filter: brightness(5); }
        100% { filter: brightness(1); }
      }
      @keyframes mcSlideTransFallOver {
        from { transform-origin: bottom center; transform: perspective(900px) rotateX(-90deg); opacity: 0; }
        to { transform: perspective(900px) rotateX(0); opacity: 1; }
      }
      @keyframes mcSlideTransDrape {
        from { transform: translateY(-100%) scaleY(1.3); opacity: 0; }
        to { transform: translateY(0) scaleY(1); opacity: 1; }
      }
      @keyframes mcSlideTransFlip {
        from { transform: perspective(1200px) rotateY(90deg); opacity: 0; }
        to { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
      }
      @keyframes mcSlideTransRotate {
        from { transform: rotate(-15deg) scale(0.8); opacity: 0; }
        to { transform: rotate(0deg) scale(1); opacity: 1; }
      }
      @keyframes mcSlideTransDissolve {
        from { opacity: 0; filter: blur(14px); }
        to { opacity: 1; filter: blur(0px); }
      }
      @keyframes mcSlideTransZoom {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes mcSlideTransPan {
        from { transform: translateX(80px) scale(1.05); }
        to { transform: translateX(0) scale(1); }
      }
      @keyframes mcSlideTransFerrisWheel {
        from { transform-origin: 50% 120%; transform: rotate(45deg); opacity: 0; }
        to { transform: rotate(0deg); opacity: 1; }
      }
      @keyframes mcSlideTransConveyor {
        from { transform: translateX(100%) scale(0.9); }
        to { transform: translateX(0) scale(1); }
      }
      @keyframes mcSlideTransOrbit {
        from { transform: perspective(1000px) rotateY(60deg) translateZ(-150px); opacity: 0; }
        to { transform: perspective(1000px) rotateY(0deg) translateZ(0); opacity: 1; }
      }
      @keyframes mcSlideTransWindow {
        from { clip-path: inset(0 50% 0 50%); opacity: 0; }
        to { clip-path: inset(0 0 0 0); opacity: 1; }
      }
    `;
  }

  /**
   * Get CSS inline style for an object animation
   */
  static getObjectAnimationStyle(
    type: AnimationType = 'none',
    durationSeconds = 0.5,
    delaySeconds = 0
  ): React.CSSProperties {
    if (type === 'none') return {};

    let animName = '';
    let fillMode = 'both';

    switch (type) {
      // Entrance
      case 'appear':
        return { animation: `mcFadeIn 0.05s ease-out ${delaySeconds}s both` };
      case 'fade-in':
        animName = 'mcFadeIn';
        break;
      case 'fly-in-bottom':
      case 'slide-up':
        animName = 'mcFlyInBottom';
        break;
      case 'fly-in-left':
      case 'slide-left':
        animName = 'mcFlyInLeft';
        break;
      case 'fly-in-right':
      case 'slide-right':
        animName = 'mcFlyInRight';
        break;
      case 'fly-in-top':
      case 'slide-down':
        animName = 'mcFlyInTop';
        break;
      case 'float-in':
        animName = 'mcFloatIn';
        break;
      case 'split':
        animName = 'mcSplitIn';
        break;
      case 'wipe':
        animName = 'mcWipeIn';
        break;
      case 'shape-in':
        animName = 'mcShapeIn';
        break;
      case 'wheel':
        animName = 'mcWheelIn';
        break;
      case 'zoom-in':
        animName = 'mcZoomIn';
        break;
      case 'bounce':
        animName = 'mcBounce';
        break;
      case 'swivel':
        animName = 'mcSwivel';
        break;
      case 'grow-turn':
        animName = 'mcGrowTurn';
        break;
      case 'elastic':
        animName = 'mcElastic';
        break;

      // Emphasis
      case 'pulse':
        animName = 'mcPulse';
        fillMode = 'none';
        break;
      case 'color-pulse':
        animName = 'mcColorPulse';
        fillMode = 'none';
        break;
      case 'teeter':
        animName = 'mcTeeter';
        fillMode = 'none';
        break;
      case 'spin':
        animName = 'mcSpinClockwise';
        fillMode = 'none';
        break;
      case 'spin-counter':
        animName = 'mcSpinCounter';
        fillMode = 'none';
        break;
      case 'grow-shrink':
        animName = 'mcGrowShrink';
        fillMode = 'none';
        break;
      case 'wave':
        animName = 'mcWave';
        fillMode = 'none';
        break;
      case 'flash':
        animName = 'mcFlash';
        fillMode = 'none';
        break;
      case 'shimmer':
        animName = 'mcShimmer';
        fillMode = 'none';
        break;
      case 'darken':
        animName = 'mcDarken';
        fillMode = 'none';
        break;
      case 'lighten':
        animName = 'mcLighten';
        fillMode = 'none';
        break;
      case 'transparency':
        animName = 'mcTransparency';
        fillMode = 'none';
        break;

      // Exit
      case 'disappear':
        return { animation: `mcDisappear 0.05s ease-in ${delaySeconds}s forwards` };
      case 'fade-out':
        animName = 'mcFadeOut';
        fillMode = 'forwards';
        break;
      case 'fly-out-bottom':
        animName = 'mcFlyOutBottom';
        fillMode = 'forwards';
        break;
      case 'fly-out-left':
        animName = 'mcFlyOutLeft';
        fillMode = 'forwards';
        break;
      case 'fly-out-right':
        animName = 'mcFlyOutRight';
        fillMode = 'forwards';
        break;
      case 'fly-out-top':
        animName = 'mcFlyOutTop';
        fillMode = 'forwards';
        break;
      case 'float-out':
        animName = 'mcFloatOut';
        fillMode = 'forwards';
        break;
      case 'split-out':
        animName = 'mcSplitOut';
        fillMode = 'forwards';
        break;
      case 'wipe-out':
        animName = 'mcWipeOut';
        fillMode = 'forwards';
        break;
      case 'zoom-out':
        animName = 'mcZoomOut';
        fillMode = 'forwards';
        break;
      case 'swivel-out':
        animName = 'mcSwivelOut';
        fillMode = 'forwards';
        break;
      case 'bounce-out':
        animName = 'mcBounceOut';
        fillMode = 'forwards';
        break;
      case 'shrink-turn':
        animName = 'mcShrinkTurn';
        fillMode = 'forwards';
        break;

      // Motion Paths
      case 'path-line-down':
        animName = 'mcPathLineDown';
        fillMode = 'forwards';
        break;
      case 'path-line-right':
        animName = 'mcPathLineRight';
        fillMode = 'forwards';
        break;
      case 'path-line-left':
        animName = 'mcPathLineLeft';
        fillMode = 'forwards';
        break;
      case 'path-line-up':
        animName = 'mcPathLineUp';
        fillMode = 'forwards';
        break;
      case 'path-arc':
        animName = 'mcPathArc';
        fillMode = 'forwards';
        break;
      case 'path-loop':
        animName = 'mcPathLoop';
        fillMode = 'forwards';
        break;

      default:
        animName = 'mcFadeIn';
        break;
    }

    return {
      animation: `${animName} ${durationSeconds}s cubic-bezier(0.16, 1, 0.3, 1) ${delaySeconds}s ${fillMode}`,
      willChange: 'transform, opacity',
    };
  }

  /**
   * Get CSS inline style for a slide transition
   */
  static getSlideTransitionStyle(
    type: TransitionType = 'fade',
    durationSeconds = 0.5
  ): React.CSSProperties {
    if (type === 'none' || type === 'cut') return {};

    let animName = 'mcSlideTransFade';
    switch (type) {
      case 'fade':
        animName = 'mcSlideTransFade';
        break;
      case 'slide-left':
        animName = 'mcSlideTransLeft';
        break;
      case 'slide-right':
        animName = 'mcSlideTransRight';
        break;
      case 'slide-up':
        animName = 'mcSlideTransUp';
        break;
      case 'slide-down':
        animName = 'mcSlideTransDown';
        break;
      case 'wipe':
        animName = 'mcSlideTransWipe';
        break;
      case 'split':
        animName = 'mcSlideTransSplit';
        break;
      case 'reveal':
        animName = 'mcSlideTransReveal';
        break;
      case 'random-bars':
        animName = 'mcSlideTransBars';
        break;
      case 'morph':
        animName = 'mcSlideTransMorph';
        break;
      case 'curtains':
        animName = 'mcSlideTransCurtains';
        break;
      case 'wind':
        animName = 'mcSlideTransWind';
        break;
      case 'prestige':
        animName = 'mcSlideTransPrestige';
        break;
      case 'fracture':
        animName = 'mcSlideTransFracture';
        break;
      case 'crush':
        animName = 'mcSlideTransCrush';
        break;
      case 'peel-off':
        animName = 'mcSlideTransPeelOff';
        break;
      case 'page-curl':
        animName = 'mcSlideTransPageCurl';
        break;
      case 'airplane':
        animName = 'mcSlideTransAirplane';
        break;
      case 'origami':
        animName = 'mcSlideTransOrigami';
        break;
      case 'flash':
        animName = 'mcSlideTransFlash';
        break;
      case 'fall-over':
        animName = 'mcSlideTransFallOver';
        break;
      case 'drape':
        animName = 'mcSlideTransDrape';
        break;
      case 'flip':
        animName = 'mcSlideTransFlip';
        break;
      case 'rotate':
        animName = 'mcSlideTransRotate';
        break;
      case 'dissolve':
        animName = 'mcSlideTransDissolve';
        break;
      case 'zoom':
        animName = 'mcSlideTransZoom';
        break;
      case 'pan':
        animName = 'mcSlideTransPan';
        break;
      case 'ferris-wheel':
        animName = 'mcSlideTransFerrisWheel';
        break;
      case 'conveyor':
        animName = 'mcSlideTransConveyor';
        break;
      case 'orbit':
        animName = 'mcSlideTransOrbit';
        break;
      case 'window':
        animName = 'mcSlideTransWindow';
        break;
    }

    return {
      animation: `${animName} ${durationSeconds}s cubic-bezier(0.16, 1, 0.3, 1) both`,
      transformOrigin: 'center center',
      willChange: 'transform, opacity, clip-path',
    };
  }
}
