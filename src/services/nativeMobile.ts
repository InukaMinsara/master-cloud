import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from 'sonner';

export class NativeMobileService {
  private static isInitialized = false;

  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static getPlatform(): 'android' | 'ios' | 'web' {
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  }

  static async init(): Promise<void> {
    if (this.isInitialized || !this.isNative()) return;
    this.isInitialized = true;

    try {
      // 1. Status Bar styling
      await StatusBar.setStyle({ style: Style.Dark });
      if (this.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#090d16' });
      }
    } catch (e) {
      console.warn('StatusBar init error:', e);
    }

    try {
      // 2. Hide splash screen after slight delay
      setTimeout(async () => {
        try {
          await SplashScreen.hide();
        } catch {}
      }, 800);
    } catch {}

    try {
      // 3. Android Back Button handling
      CapApp.addListener('backButton', ({ canGoBack }) => {
        // If there are open modals or back navigation
        if (canGoBack) {
          window.history.back();
        } else {
          // Exit or minimize app
          CapApp.minimizeApp();
        }
      });
    } catch (e) {
      console.warn('BackButton listener error:', e);
    }
  }

  /**
   * Share file or link via native Android share sheet
   */
  static async share(options: { title: string; text?: string; url?: string; dialogTitle?: string }): Promise<boolean> {
    if (this.isNative()) {
      try {
        await Share.share({
          title: options.title,
          text: options.text || options.title,
          url: options.url,
          dialogTitle: options.dialogTitle || 'Share via Master Cloud',
        });
        return true;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    }

    // Web fallback
    if (navigator.share && options.url) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
        return true;
      } catch {}
    }

    // Clipboard fallback
    if (options.url && navigator.clipboard) {
      await navigator.clipboard.writeText(options.url);
      toast.success('Link copied to clipboard!');
      return true;
    }

    return false;
  }

  /**
   * Save file directly into Android Storage (Documents / Download)
   */
  static async saveFileToDevice(filename: string, base64Data: string): Promise<string | null> {
    if (!this.isNative()) return null;

    try {
      const result = await Filesystem.writeFile({
        path: `MasterCloud/${filename}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      return result.uri;
    } catch (err) {
      console.warn('Filesystem save error:', err);
      // Fallback to cache directory
      try {
        const fallback = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });
        return fallback.uri;
      } catch {
        return null;
      }
    }
  }
}
