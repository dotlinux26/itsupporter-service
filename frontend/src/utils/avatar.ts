/**
 * Google-style avatar fallback utilities for frontend
 */

const PALETTE = [
  '#EA580C', // IT Supporter Orange (Brand Primary)
  '#1A73E8', // Google Blue
  '#D93025', // Google Red
  '#188038', // Google Green
  '#F29900', // Google Amber/Yellow
  '#8B5CF6', // Purple
  '#059669', // Emerald
  '#0284C7', // Sky Blue
  '#DB2777', // Pink
  '#7C3AED', // Deep Violet
  '#0D9488', // Teal
  '#D97706', // Warm Amber
];

export function getAvatarInitial(name?: string | null, email?: string | null): string {
  const cleanName = (name ?? '').trim();
  const cleanEmail = (email ?? '').trim();

  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    const lastWord = parts[parts.length - 1];
    if (lastWord && lastWord[0]) {
      return lastWord[0].toUpperCase();
    }
  }

  if (cleanEmail) {
    return cleanEmail[0].toUpperCase();
  }

  return 'IT';
}

export function getAvatarBgColor(name?: string | null, email?: string | null): string {
  const str = (name ?? '').trim() || (email ?? '').trim() || 'IT';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}
