import React, { useState } from 'react';

interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
}

const FALLBACK_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300" fill="%23f1f5f9"/><path d="M160 130a20 20 0 1 0 0-40 20 20 0 0 0 0 40zm-40 70l40-50 30 35 40-60 50 75H120z" fill="%2394a3b8"/><text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="14">Nyimba Deals</text></svg>';

export default function FastImage({ src, alt, className = '', ...props }: FastImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
      )}
      <img
        src={hasError || !src ? FALLBACK_SVG : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}
