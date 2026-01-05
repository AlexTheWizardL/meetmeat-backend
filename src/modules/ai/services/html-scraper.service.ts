import { Injectable, Logger } from '@nestjs/common';
import { load } from 'cheerio';
import type { BrandColors } from '../ai.interface';

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

  private extractDescription($: CheerioInstance): string | undefined {
    const desc =
      $('meta[property="og:description"]').attr('content') ??
      $('meta[name="description"]').attr('content') ??
      $('meta[name="twitter:description"]').attr('content');
    return desc !== undefined && desc !== '' ? desc.trim() : undefined;
  }

  private extractLogo($: CheerioInstance, baseUrl: string): string | undefined {
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

  private extractColors($: CheerioInstance): string[] {
    const colors = new Set<string>();

    $('style').each((_, el) => {
      const css = $(el).text();
      this.extractColorsFromCss(css, colors);
    });

    $('[style]').each((_, el) => {
      const style = $(el).attr('style') ?? '';
      this.extractColorsFromCss(style, colors);
    });

    const themeColor = $('meta[name="theme-color"]').attr('content');
    if (themeColor !== undefined && themeColor !== '') {
      colors.add(themeColor.toUpperCase());
    }

    return Array.from(colors).slice(0, 10);
  }

  private extractColorsFromCss(css: string, colors: Set<string>): void {
    const hexPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
    let match;
    while ((match = hexPattern.exec(css)) !== null) {
      const color = match[0].toUpperCase();
      if (!this.isCommonColor(color)) {
        colors.add(color);
      }
    }

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

  private rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
    ).toUpperCase();
  }

  private extractFonts($: CheerioInstance): string[] {
    const fonts = new Set<string>();

    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const familyMatch = /family=([^&:]+)/.exec(href);
      if (familyMatch) {
        fonts.add(familyMatch[1].replace(/\+/g, ' '));
      }
    });

    $('style').each((_, el) => {
      const css = $(el).text();
      this.extractFontsFromCss(css, fonts);
    });

    $('[style*="font-family"]').each((_, el) => {
      const style = $(el).attr('style') ?? '';
      this.extractFontsFromCss(style, fonts);
    });

    return Array.from(fonts).slice(0, 5);
  }

  private extractFontsFromCss(css: string, fonts: Set<string>): void {
    const fontPattern = /font-family:\s*['"]?([^'";,}]+)/gi;
    let match;
    while ((match = fontPattern.exec(css)) !== null) {
      const font = match[1].trim();
      if (
        !['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'].includes(
          font.toLowerCase(),
        )
      ) {
        fonts.add(font);
      }
    }
  }

  private extractLinks($: CheerioInstance): { text: string; href: string }[] {
    const links: { text: string; href: string }[] = [];

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
