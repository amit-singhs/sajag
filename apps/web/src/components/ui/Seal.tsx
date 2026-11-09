import { Link } from 'react-router-dom';

export function Seal({ size = 36, ring = '#B5381C' }: { size?: number; ring?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke={ring} strokeWidth="1.5" />
      <circle cx="20" cy="20" r="14" fill="#B5381C" />
      <path d="M13 20.5l4.5 4.5L27 15.5" fill="none" stroke="#F7F4EC" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ to = '/', sub, inverse }: { to?: string; sub?: string; inverse?: boolean }) {
  return (
    <Link to={to} className={`wordmark${inverse ? ' wordmark--inverse' : ''}`} aria-label="सजग — मुखपृष्ठ">
      <Seal ring={inverse ? '#E8805F' : '#B5381C'} />
      <span className="wordmark__text">
        <span className="wordmark__name">सजग</span>
        {sub && <span className="wordmark__sub">{sub}</span>}
      </span>
    </Link>
  );
}
