// src/components/ImageWithFallback.jsx
import { useState } from 'react';

const ImageWithFallback = ({ src, alt, fallbackText, className }) => {
  const [hasError, setHasError] = useState(false);
  
  // 1. Simpan jejak src sebelumnya
  const [prevSrc, setPrevSrc] = useState(src);

  // 2. 🌸 YUKI'S MAGIC: Update state langsung di fase render!
  // Ini jauh lebih cepat dan disukai oleh React Linter.
  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
  }

  // Jika URL kosong atau gambar gagal dimuat (hasError true), tampilkan kotak 404
  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-200 text-gray-500 font-semibold text-xs text-center overflow-hidden border border-gray-300 ${className}`}>
        <span className="text-lg mb-1">404</span>
        <span className="truncate w-full px-4 opacity-70">({fallbackText || alt})</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setHasError(true)} 
    />
  );
};

export default ImageWithFallback;