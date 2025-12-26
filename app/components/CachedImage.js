import React, { useState, useEffect, useRef } from "react";

/**
 * CachedImage component with lazy loading and browser caching optimization
 * - Uses Intersection Observer for lazy loading
 * - Leverages browser's native cache with proper headers
 * - Provides loading states for better UX
 */
export default function CachedImage({ src, alt, className, placeholder }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Create Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before image comes into view
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isInView || !src) return;

    // Preload image to leverage browser cache
    const img = new Image();

    img.onload = () => {
      setIsLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load image:", src);
      setIsLoaded(true); // Still set to loaded to show alt text
    };

    // Add cache-busting prevention by using the same URL
    img.src = src;

  }, [isInView, src]);

  return (
    <div ref={imgRef} className={className} style={{ position: "relative" }}>
      {!isLoaded && placeholder && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {placeholder}
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={className}
          loading="lazy"
          decoding="async"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out"
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}

