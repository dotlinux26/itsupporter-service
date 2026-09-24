import React, { useState } from 'react';
import { getAvatarInitial, getAvatarBgColor } from '../utils/avatar';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number | string; // e.g. 32, 40, 48, or Tailwind size classes
  className?: string;
  alt?: string;
}

export function Avatar({
  src,
  name,
  email,
  size = 40,
  className = '',
  alt,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initial = getAvatarInitial(name, email);
  const bgColor = getAvatarBgColor(name, email);

  const isNumericSize = typeof size === 'number';
  const sizePx = isNumericSize ? size : 40;
  const fontSize = Math.max(12, Math.round(sizePx * 0.44));

  const dimensionStyle: React.CSSProperties = isNumericSize
    ? { width: `${sizePx}px`, height: `${sizePx}px`, minWidth: `${sizePx}px`, minHeight: `${sizePx}px` }
    : {};

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        onError={() => setHasError(true)}
        style={dimensionStyle}
        className={`rounded-full object-cover border border-border/40 shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        ...dimensionStyle,
        backgroundColor: bgColor,
        fontSize: `${fontSize}px`,
      }}
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm select-none transition-transform hover:scale-105 ${className}`}
      title={name || email || 'Avatar'}
      aria-label={name || email || 'Avatar'}
    >
      {initial}
    </div>
  );
}
