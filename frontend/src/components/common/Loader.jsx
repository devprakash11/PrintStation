import { useEffect, useState } from 'react';

const LOADING_EVENT = 'printstation:loading';

const LOADER_STYLES = `
  .app-loader {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--color-ink, #171717);
    font-family: var(--font-body, sans-serif);
  }

  .app-loader--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    flex-direction: column;
    background: rgba(250, 250, 249, 0.78);
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
  }

  .app-loader__spinner {
    width: 38px;
    height: 38px;
    border: 3px solid var(--color-accent-soft, #fff1eb);
    border-top-color: var(--color-accent, #e85d2a);
    border-radius: 50%;
    animation: printstation-loader-spin 0.8s linear infinite;
  }

  .app-loader__label {
    margin: 0;
    color: var(--color-ink-soft, #525252);
    font-size: 13px;
    font-weight: 700;
  }

  @keyframes printstation-loader-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .app-loader__spinner { animation: none; }
  }
`;

export default function Loader({ label = 'Loading...', fullScreen = true }) {
  return (
    <div
      className={fullScreen ? 'app-loader app-loader--fullscreen' : 'app-loader'}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <style>{LOADER_STYLES}</style>
      <span className="app-loader__spinner" aria-hidden="true" />
      <p className="app-loader__label">{label}</p>
    </div>
  );
}

export function InitialLoader({ label = 'Checking your admin session...' }) {
  return <Loader label={label} fullScreen />;
}

export function ApiLoader({ label = 'Please wait...' }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleLoading = (event) => {
      setActive(Boolean(event.detail?.active));
    };

    window.addEventListener(LOADING_EVENT, handleLoading);
    return () => window.removeEventListener(LOADING_EVENT, handleLoading);
  }, []);

  if (!active) return null;
  return <Loader label={label} fullScreen />;
}
