"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { findPhotoBounds, photoTransform, type PhotoBounds } from "@/lib/catalog-photo-framing";
import { catalogPhotoUrl } from "@/lib/catalog-photo-url";

const boundsCache = new Map<string, PhotoBounds | null>();

export function CatalogImage({ onLoad, style, ...props }: ImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [transform, setTransform] = useState("none");
  const displaySrc = typeof props.src === "string" ? catalogPhotoUrl(props.src) : props.src;
  const serverPrepared = displaySrc !== props.src;

  useEffect(() => {
    const image = imageRef.current;
    if (!image || !props.fill || serverPrepared) return;
    let bounds: PhotoBounds | null = null;
    const resize = () => setTransform(bounds
      ? photoTransform(bounds, image.naturalWidth, image.naturalHeight, image.clientWidth, image.clientHeight)
      : "none");
    const frame = () => {
      if (!image.naturalWidth) return;
      const key = image.currentSrc || image.src;
      if (boundsCache.has(key)) {
        bounds = boundsCache.get(key) ?? null;
      } else {
        try {
          const factor = Math.min(1, 384 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * factor));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (context) {
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            bounds = findPhotoBounds(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
          }
        } catch {
          // Cross-origin photos without CORS remain completely visible.
          bounds = null;
        }
        if (boundsCache.size >= 300) boundsCache.clear();
        boundsCache.set(key, bounds);
      }
      resize();
    };
    setTransform("none");
    image.addEventListener("load", frame);
    if (image.complete) frame();
    const observer = new ResizeObserver(resize);
    observer.observe(image);
    return () => { image.removeEventListener("load", frame); observer.disconnect(); };
  }, [props.src, props.fill, serverPrepared]);

  return <Image {...props} src={displaySrc} ref={imageRef} onLoad={onLoad}
    data-photo-framing={serverPrepared ? "server" : transform === "none" ? "original" : "fitted"}
    style={{ ...style, objectFit: "contain", ...(props.fill ? {
      padding: serverPrepared ? 4 : 0,
      transform: serverPrepared ? "none" : transform, transformOrigin: "center",
    } : {}) }} />;
}
