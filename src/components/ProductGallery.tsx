'use client';

import { useState } from 'react';
import { mediaUrl } from '@/lib/supabase/public';

export type MediaItem = { storage_path: string; type: string };

export default function ProductGallery({ media, name }: { media: MediaItem[]; name: string }) {
  const [index, setIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="gallery-main empty">
        <span className="muted">No photo yet</span>
      </div>
    );
  }
  const current = media[Math.min(index, media.length - 1)];

  return (
    <div className="gallery">
      <div className="gallery-main">
        {current.type === 'video' ? (
          <video key={current.storage_path} src={mediaUrl(current.storage_path)} controls playsInline preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.storage_path} src={mediaUrl(current.storage_path)} alt={name} />
        )}
      </div>
      {media.length > 1 && (
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
    </div>
  );
}
