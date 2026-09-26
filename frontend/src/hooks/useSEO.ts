import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
}

export function useSEO({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = '/logo_bo3goc.png',
  ogType = 'website',
}: SEOProps) {
  useEffect(() => {
    // 1. Update Document Title
    if (title) {
      document.title = title;
    }

    // Helper: update or create meta tag by selector
    const updateOrCreateMeta = (attrName: 'name' | 'property', attrValue: string, content?: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    if (description) {
      updateOrCreateMeta('name', 'description', description);
    }
    if (keywords) {
      updateOrCreateMeta('name', 'keywords', keywords);
    }

    // 3. Open Graph Tags
    const effectiveOgTitle = ogTitle || title;
    const effectiveOgDesc = ogDescription || description;

    if (effectiveOgTitle) {
      updateOrCreateMeta('property', 'og:title', effectiveOgTitle);
      updateOrCreateMeta('name', 'twitter:title', effectiveOgTitle);
    }
    if (effectiveOgDesc) {
      updateOrCreateMeta('property', 'og:description', effectiveOgDesc);
      updateOrCreateMeta('name', 'twitter:description', effectiveOgDesc);
    }
    if (ogImage) {
      updateOrCreateMeta('property', 'og:image', ogImage);
      updateOrCreateMeta('name', 'twitter:image', ogImage);
    }
    if (ogType) {
      updateOrCreateMeta('property', 'og:type', ogType);
    }

    // 4. Canonical URL Link
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonical);
    }
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType]);
}
