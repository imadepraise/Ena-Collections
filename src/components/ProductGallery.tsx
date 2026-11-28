'use client';

import { useCallback, useEffect, useState } from 'react';
import { mediaUrl } from '@/lib/supabase/public';

export type MediaItem = { storage_path: string; type: string };

export default function ProductGallery({ media, name }: { media: MediaItem[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const count = media.length;

  const go = useCallback((d: number) => setIndex((i) => (count ? (i + d + count) % count : 0)), [count]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, go]);

  if (count === 0) {
    return (
      <div className="gallery-main empty">
        <span className="muted">No photo yet</span>
      </div>
    );
  }
  const current = media[Math.min(index, count - 1)];

  return (
    <div className="gallery">
      <div className="gallery-main float-slow">
        {current.type === 'video' ? (
          <video key={current.storage_path} className="pop" src={mediaUrl(current.storage_path)} controls playsInline preload="metadata" />
        ) : (
          <button type="button" className="zoom-btn" onClick={() => setOpen(true)} aria-label="Enlarge photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={current.storage_path} className="pop" src={mediaUrl(current.storage_path)} alt={name} />
          </button>
        )}
        <button type="button" className="enlarge" onClick={() => setOpen(true)}>
          Enlarge
        </button>
      </div>

      {count > 1 && (
        <div className="thumbs">
          {media.map((m, i) => (
            <button key={m.storage_path} type="button" className={i === index ? 'thumb on' : 'thumb'} onClick={() => setIndex(i)} aria-label={`Show ${m.type} ${i + 1}`}>
              {m.type === 'video' ? (
                <span className="thumb-video">Video</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(m.storage_path)} alt="" />
              )}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${name} gallery`} onClick={() => setOpen(false)}>
          <button type="button" className="lb-btn lb-close" onClick={() => setOpen(false)} aria-label="Close">
            &times;
          </button>
          {count > 1 && (
            <button type="button" className="lb-btn lb-prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous">
              &lsaquo;
            </button>
          )}
          <div className="lightbox-inner" key={current.storage_path} onClick={(e) => e.stopPropagation()}>
            {current.type === 'video' ? (
              <video className="lightbox-media" src={mediaUrl(current.storage_path)} controls autoPlay playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="lightbox-media" src={mediaUrl(current.storage_path)} alt={name} />
            )}
          </div>
          {count > 1 && (
            <button type="button" className="lb-btn lb-next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next">
              &rsaquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
