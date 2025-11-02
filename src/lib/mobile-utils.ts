/**
 * Mobile Optimization Utilities
 *
 * Helpers for detecting mobile devices and optimizing mobile experience
 */

/**
 * Detect if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect if device is tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
    userAgent
  );
}

/**
 * Detect if device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Detect if device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android/i.test(navigator.userAgent);
}

/**
 * Get device type
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(): DeviceType {
  if (isTablet()) return 'tablet';
  if (isMobile()) return 'mobile';
  return 'desktop';
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
}

/**
 * Check if viewport is mobile size
 */
export function isMobileViewport(): boolean {
  const { width } = getViewportDimensions();
  return width < 768; // Tailwind's md breakpoint
}

/**
 * Check if viewport is tablet size
 */
export function isTabletViewport(): boolean {
  const { width } = getViewportDimensions();
  return width >= 768 && width < 1024; // Between md and lg
}

/**
 * Get network connection type
 */
export function getConnectionType(): string {
  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    return 'unknown';
  }

  return (navigator as any).connection.effectiveType || 'unknown';
}

/**
 * Check if connection is slow (2G or slow-2g)
 */
export function isSlowConnection(): boolean {
  const type = getConnectionType();
  return type === 'slow-2g' || type === '2g';
}

/**
 * Optimize images for mobile
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
): string {
  // This is a placeholder - in production, you'd use an image optimization service
  // like Cloudinary, imgix, or Next.js Image Optimization
  const params = new URLSearchParams();

  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.format) params.set('f', options.format);

  return `${url}${params.toString() ? `?${params.toString()}` : ''}`;
}

/**
 * Lazy load images on mobile
 */
export function setupLazyLoading(): void {
  if (typeof window === 'undefined') return;

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px', // Start loading 50px before entering viewport
    }
  );

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
}

/**
 * Prevent zoom on input focus (iOS)
 */
export function preventZoomOnFocus(): void {
  if (!isIOS()) return;

  // Add meta tag to prevent zoom
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    const content = viewport.getAttribute('content') || '';
    if (!content.includes('maximum-scale')) {
      viewport.setAttribute(
        'content',
        `${content}, maximum-scale=1.0, user-scalable=0`
      );
    }
  }
}

/**
 * Enable smooth scrolling for mobile
 */
export function enableSmoothScroll(): void {
  if (typeof document === 'undefined') return;

  document.documentElement.style.scrollBehavior = 'smooth';
}

/**
 * Disable pull-to-refresh on mobile
 */
export function disablePullToRefresh(): void {
  if (typeof document === 'undefined') return;

  document.body.style.overscrollBehavior = 'none';
}

/**
 * Safe area insets for iOS notch
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined' || !isIOS()) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);

  return {
    top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--sal') || '0'),
  };
}

/**
 * Vibrate device (if supported)
 */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  navigator.vibrate(pattern);
}

/**
 * Show native share dialog
 */
export async function nativeShare(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
}

/**
 * Request wake lock to prevent screen from sleeping
 */
export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return null;
  }

  try {
    const wakeLock = await (navigator as any).wakeLock.request('screen');
    return wakeLock;
  } catch (error) {
    console.error('Wake Lock failed:', error);
    return null;
  }
}

/**
 * Detect if app is in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Add to home screen prompt
 */
export class AddToHomeScreen {
  private deferredPrompt: any = null;

  constructor() {
    this.setupListener();
  }

  private setupListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  canPrompt(): boolean {
    return this.deferredPrompt !== null;
  }

  async prompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;

    return outcome === 'accepted';
  }
}

/**
 * Mobile gesture helpers
 */
export class GestureDetector {
  private startX = 0;
  private startY = 0;
  private startTime = 0;

  constructor(
    private element: HTMLElement,
    private callbacks: {
      onSwipeLeft?: () => void;
      onSwipeRight?: () => void;
      onSwipeUp?: () => void;
      onSwipeDown?: () => void;
      onTap?: () => void;
      onLongPress?: () => void;
    }
  ) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    });
    this.element.addEventListener('touchend', this.handleTouchEnd, {
      passive: true,
    });
  }

  private handleTouchStart = (e: TouchEvent): void => {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = endTime - this.startTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Detect tap
    if (absX < 10 && absY < 10) {
      if (deltaTime < 200 && this.callbacks.onTap) {
        this.callbacks.onTap();
      } else if (deltaTime >= 500 && this.callbacks.onLongPress) {
        this.callbacks.onLongPress();
      }
      return;
    }

    // Detect swipe
    const threshold = 50;

    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      if (deltaX > 0 && this.callbacks.onSwipeRight) {
        this.callbacks.onSwipeRight();
      } else if (deltaX < 0 && this.callbacks.onSwipeLeft) {
        this.callbacks.onSwipeLeft();
      }
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      if (deltaY > 0 && this.callbacks.onSwipeDown) {
        this.callbacks.onSwipeDown();
      } else if (deltaY < 0 && this.callbacks.onSwipeUp) {
        this.callbacks.onSwipeUp();
      }
    }
  };

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}
