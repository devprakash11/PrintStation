export default function BrandLogo({ className = '', compact = false }) {
  return (
    <a className={`brand-logo ${className}`} href="/" aria-label="PrintStation home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="img">
          <rect x="3" y="3" width="34" height="34" rx="10" fill="currentColor" opacity="0.12" />
          <path d="M12 15.5h16v8H12z" fill="currentColor" />
          <path d="M10 21h20v7.5H10z" fill="currentColor" opacity="0.72" />
          <path d="M15 10h10v7H15z" fill="currentColor" />
          <circle cx="27" cy="24.5" r="1.6" fill="white" />
        </svg>
      </span>
      {!compact && <span className="brand-name">PrintStation</span>}
    </a>
  );
}