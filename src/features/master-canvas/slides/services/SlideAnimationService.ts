import { AnimationType, TransitionType } from '../types';

export class SlideAnimationService {
  /**
   * CSS Keyframe strings for standalone HTML and web runtime
   */
  static getAnimationKeyframesCss(): string {
    return `
      @keyframes mcFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mcSlideUp {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mcSlideDown {
        from { opacity: 0; transform: translateY(-40px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes mcZoomIn {
        from { opacity: 0; transform: scale(0.4); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes mcBounce {
        0% { opacity: 0; transform: scale(0.3); }
        50% { opacity: 1; transform: scale(1.08); }
        75% { transform: scale(0.96); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes mcFlip {
        from { opacity: 0; transform: perspective(600px) rotateX(90deg); }
        to { opacity: 1; transform: perspective(600px) rotateX(0deg); }
      }
      @keyframes mcSpin {
        from { opacity: 0; transform: rotate(-180deg) scale(0.5); }
        to { opacity: 1; transform: rotate(0deg) scale(1); }
      }

      /* Slide Transitions */
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
      @keyframes mcSlideTransZoom {
        from { opacity: 0; transform: scale(0.65); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes mcSlideTransFlip {
        from { opacity: 0; transform: perspective(1200px) rotateY(90deg); }
        to { opacity: 1; transform: perspective(1200px) rotateY(0deg); }
      }
      @keyframes mcSlideTransRotate {
        from { opacity: 0; transform: rotate(-15deg) scale(0.85); }
        to { opacity: 1; transform: rotate(0deg) scale(1); }
      }
      @keyframes mcSlideTransDissolve {
        from { opacity: 0; filter: blur(12px); }
        to { opacity: 1; filter: blur(0px); }
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
    switch (type) {
      case 'appear':
        return { animation: `mcFadeIn 0.05s ease-out ${delaySeconds}s both` };
      case 'fade-in':
        animName = 'mcFadeIn';
        break;
      case 'slide-up':
        animName = 'mcSlideUp';
        break;
      case 'slide-down':
        animName = 'mcSlideDown';
        break;
      case 'zoom-in':
        animName = 'mcZoomIn';
        break;
      case 'bounce':
        animName = 'mcBounce';
        break;
      case 'flip':
        animName = 'mcFlip';
        break;
      case 'spin':
        animName = 'mcSpin';
        break;
    }

    return {
      animation: `${animName} ${durationSeconds}s cubic-bezier(0.16, 1, 0.3, 1) ${delaySeconds}s both`,
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
    if (type === 'none') return {};

    let animName = '';
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
      case 'zoom':
        animName = 'mcSlideTransZoom';
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
    }

    return {
      animation: `${animName} ${durationSeconds}s cubic-bezier(0.16, 1, 0.3, 1) both`,
      transformOrigin: 'center center',
      willChange: 'transform, opacity',
    };
  }
}
