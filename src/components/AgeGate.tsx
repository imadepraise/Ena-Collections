'use client';

import { useEffect, useState } from 'react';

const KEY = 'ena_age_confirmed';

export default function AgeGate() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === 'yes') setOpen(false);
    } catch {
      // storage blocked: keep the gate open
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function confirmAge() {
    try {
      localStorage.setItem(KEY, 'yes');
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-title">
      <div className="age-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="ENA COLLECTION" className="age-logo" />
        <h2 id="age-title">Are you 18 or older?</h2>
        <p>ENA COLLECTION sells adult products. You must be 18 or older to enter.</p>
        <div className="age-actions">
          <button type="button" className="btn" onClick={confirmAge}>
            I am 18 or older
          </button>
          <a className="btn btn-outline" href="https://www.google.com">
            I am under 18
          </a>
        </div>
      </div>
    </div>
  );
}
