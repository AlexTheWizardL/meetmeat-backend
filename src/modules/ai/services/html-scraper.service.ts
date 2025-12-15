import { Injectable, Logger } from '@nestjs/common';
import { load } from 'cheerio';
import type { BrandColors } from '../ai.interface';

// Type alias for cheerio's load return type
type CheerioInstance = ReturnType<typeof load>;

export interface ScrapedData {
  title?: string;
  description?: string;
  logoUrl?: string;
  ogImage?: string;
  colors: string[];
  fontFamilies: string[];
  links: { text: string; href: string }[];
}

@Injectable()
export class HtmlScraperService {
  private readonly logger = new Logger(HtmlScraperService.name);

  /**
   * Extract structured data from HTML
   */
  scrape(html: string, baseUrl: string): ScrapedData {
    const $ = load(html);

    return {
      title: this.extractTitle($),
      description: this.extractDescription($),
      logoUrl: this.extractLogo($, baseUrl),
      ogImage: this.extractOgImage($, baseUrl),
      colors: this.extractColors($),
      fontFamilies: this.extractFonts($),
      links: this.extractLinks($),
    };
  }

  /**
   * Extract page title
   */
  private extractTitle($: CheerioInstance): string | undefined {
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle !== undefined && ogTitle !== '') return ogTitle.trim();

    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    if (twitterTitle !== undefined && twitterTitle !== '')
      return twitterTitle.trim();

    const pageTitle = $('title').text();
    if (pageTitle !== '') return pageTitle.trim();

    const h1Title = $('h1').first().text();
    if (h1Title !== '') return h1Title.trim();

    return undefined;
  }

  /**
   * Extract page description
   */
  private extractDescription($: CheerioInstance): string | undefined {
    const desc =
      $('meta[property="og:description"]').attr('content') ??
      $('meta[name="description"]').attr('content') ??
      $('meta[name="twitter:description"]').attr('content');
    return desc !== undefined && desc !== '' ? desc.trim() : undefined;
  }

  /**
   * Extract logo URL
   */
  private extractLogo($: CheerioInstance, baseUrl: string): string | undefined {
    // Try common logo selectors
    const logoSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      '[class*="logo"] img',
      '[id*="logo"] img',
      'header img',
      'nav img',
      '.navbar img',
    ];

    for (const selector of logoSelectors) {
      const element = $(selector).first();
      const src = element.attr('src') ?? element.attr('href');
      if (src !== undefined && src !== '') {
        return this.resolveUrl(src, baseUrl);
      }
    }

    return undefined;
  }

  /**
   * Extract Open Graph image
   */
  private extractOgImage(
    $: CheerioInstance,
    baseUrl: string,
  ): string | undefined {
    const ogImage =
      $('meta[property="og:image"]').attr('content') ??
      $('meta[name="twitter:image"]').attr('content');

    if (ogImage !== undefined && ogImage !== '') {
      return this.resolveUrl(ogImage, baseUrl);
    }

    return undefined;
  }

  /**
   * Extract colors from inline styles and style tags
   */
  private extractColors($: CheerioInstance): string[] {
    const colors = new Set<string>();

    // Extract from style tags
    $('style').each((_, el) => {
      const css = $(el).text();
      this.extractColorsFromCss(css, colors);
    });

    // Extract from inline styles
    $('[style]').each((_, el) => {
      const style = $(el).attr('style') ?? '';
      this.extractColorsFromCss(style, colors);
    });

    // Extract from meta theme-color
    const themeColor = $('meta[name="theme-color"]').attr('content');
    if (themeColor !== undefined && themeColor !== '') {
      colors.add(themeColor.toUpperCase());
    }

    return Array.from(colors).slice(0, 10); // Limit to 10 colors
  }

  /**
   * Extract hex colors from CSS string
   */
  private extractColorsFromCss(css: string, colors: Set<string>): void {
    // Match hex colors
    const hexPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
    let match;
    while ((match = hexPattern.exec(css)) !== null) {
      const color = match[0].toUpperCase();
      // Skip common non-brand colors
      if (!this.isCommonColor(color)) {
        colors.add(color);
      }
    }

    // Match rgb/rgba colors and convert to hex
    const rgbPattern = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
    while ((match = rgbPattern.exec(css)) !== null) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const hex = this.rgbToHex(r, g, b);
      if (!this.isCommonColor(hex)) {
        colors.add(hex);
      }
    }
  }

  /**
   * Check if color is a common non-brand color (black, white, gray)
   */
  private isCommonColor(hex: string): boolean {
    const common = [
      '#000000',
      '#FFFFFF',
      '#000',
      '#FFF',
      '#333333',
      '#666666',
      '#999999',
      '#CCCCCC',
      '#F5F5F5',
      '#EEEEEE',
      '#DDDDDD',
    ];
    return common.includes(hex.toUpperCase());
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
    ).toUpperCase();
  }

  /**
   * Extract font families from the page
   */
  private extractFonts($: CheerioInstance): string[] {
    const fonts = new Set<string>();

    // Extract from Google Fonts links
    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const familyMatch = /family=([^&:]+)/.exec(href);
      if (familyMatch) {
        fonts.add(familyMatch[1].replace(/\+/g, ' '));
      }
    });

    // Extract from style tags
    $('style').each((_, el) => {
      const css = $(el).text();
      this.extractFontsFromCss(css, fonts);
    });

    // Extract from inline styles
    $('[style*="font-family"]').each((_, el) => {
      const style = $(el).attr('style') ?? '';
      this.extractFontsFromCss(style, fonts);
    });

    return Array.from(fonts).slice(0, 5); // Limit to 5 fonts
  }

  /**
   * Extract font families from CSS
   */
  private extractFontsFromCss(css: string, fonts: Set<string>): void {
    const fontPattern = /font-family:\s*['"]?([^'";,}]+)/gi;
    let match;
    while ((match = fontPattern.exec(css)) !== null) {
      const font = match[1].trim();
      // Skip generic font families
      if (
        !['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'].includes(
          font.toLowerCase(),
        )
      ) {
        fonts.add(font);
      }
    }
  }

  /**
   * Extract important links from the page
   */
  private extractLinks($: CheerioInstance): { text: string; href: string }[] {
    const links: { text: string; href: string }[] = [];

    // Look for date/location related links
    const keywords = [
      'register',
      'ticket',
      'schedule',
      'agenda',
      'speaker',
      'venue',
      'location',
      'date',
      'when',
      'where',
    ];

    $('a').each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      const href = $(el).attr('href');
      if (
        href !== undefined &&
        href !== '' &&
        keywords.some((kw) => text.includes(kw))
      ) {
        links.push({ text: $(el).text().trim(), href });
      }
    });

    return links.slice(0, 10);
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return `${base.origin}${url}`;
    }
    return `${base.origin}/${url}`;
  }

  /**
   * Convert scraped colors to BrandColors format
   */
  toBrandColors(colors: string[]): BrandColors | undefined {
    if (colors.length === 0) {
      return undefined;
    }

    return {
      primary: colors[0],
      secondary: colors[1],
      accent: colors[2],
    };
  }
}
