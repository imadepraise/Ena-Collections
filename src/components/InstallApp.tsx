'use client';

import { useEffect, useState } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void> };

// Shows an "Install the app" button when the browser allows it,
// or short instructions on iPhone and iPad (where installing is done from the Share menu).
export default function InstallApp() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  if (evt) {
    return (
      <button
        type="button"
        className="btn btn-outline btn-sm install-btn"
        onClick={async () => {
          await evt.prompt();
          setEvt(null);
        }}
      >
        Install the app
      </button>
    );
  }

  if (ios) {
    return (
      <div>
        <button type="button" className="btn btn-outline btn-sm install-btn" onClick={() => setHelp(!help)}>
          Add to Home Screen
        </button>
        {help && (
          <p className="install-help">
            Tap the Share button at the bottom of Safari, then choose &quot;Add to Home Screen&quot;.
          </p>
        )}
      </div>
    );
  }

  return null;
}
