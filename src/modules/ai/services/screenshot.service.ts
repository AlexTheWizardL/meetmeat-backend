import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

export interface ScreenshotResult {
  screenshot: Buffer;
  html: string;
  url: string;
}

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);
  private browser: Browser | null = null;
  private browserLock: Promise<Browser> | null = null;

  /**
   * Capture screenshot and HTML from a URL
   */
  async capture(url: string): Promise<ScreenshotResult> {
    this.logger.log(`Capturing screenshot for: ${url}`);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport for consistent screenshots
      await page.setViewport({ width: 1280, height: 800 });

      // Set user agent to avoid bot detection
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- setUserAgent works, no clear alternative
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Remove common popups and cookie banners
      await this.removePopups(page);

      // Wait a bit for any animations to settle
      await this.delay(1000);

      // Capture screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false, // Just the viewport, not full page
      });

      // Get the HTML content
      const html = await page.content();

      return {
        screenshot: screenshot as Buffer,
        html,
        url,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Remove common popups, cookie banners, and overlays
   */
  private async removePopups(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        // Common selectors for popups and cookie banners
        const selectorsToRemove = [
          // Cookie consent
          '[class*="cookie"]',
          '[id*="cookie"]',
          '[class*="consent"]',
          '[id*="consent"]',
          '[class*="gdpr"]',
          '[id*="gdpr"]',
          // Popups and modals
          '[class*="popup"]',
          '[class*="modal"]',
          '[class*="overlay"]',
          '[class*="newsletter"]',
          '[class*="subscribe"]',
          // Common cookie banner IDs
          '#onetrust-consent-sdk',
          '#CybotCookiebotDialog',
          '.cc-banner',
          '.cookie-banner',
          '.cookie-notice',
          // Fixed position elements that might be banners
          '[style*="position: fixed"]',
        ];

        selectorsToRemove.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            const element = el as HTMLElement;
            // Only remove if it looks like a popup (small or covers screen)
            const rect = element.getBoundingClientRect();
            if (
              rect.height < 300 ||
              rect.width === window.innerWidth ||
              element.style.position === 'fixed'
            ) {
              element.remove();
            }
          });
        });

        // Remove any remaining fixed position elements that look like overlays
        document.querySelectorAll('*').forEach((el) => {
          const style = window.getComputedStyle(el);
          if (
            style.position === 'fixed' &&
            (style.zIndex === '9999' ||
              parseInt(style.zIndex) > 1000 ||
              el.classList.toString().includes('modal') ||
              el.classList.toString().includes('overlay'))
          ) {
            (el as HTMLElement).remove();
          }
        });
      });
    } catch {
      // Ignore errors - popup removal is best effort
      this.logger.debug('Could not remove some popups');
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected === true) {
      return this.browser;
    }

    if (this.browserLock) {
      return this.browserLock;
    }

    this.browserLock = this.createBrowser();
    try {
      this.browser = await this.browserLock;
      return this.browser;
    } finally {
      this.browserLock = null;
    }
  }

  private async createBrowser(): Promise<Browser> {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    return puppeteer.launch({
      headless: true,
      executablePath: executablePath !== '' ? executablePath : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
