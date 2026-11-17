import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  size?: 'nav' | 'footer';
  showText?: boolean;
}

export function BrandLogo({ to = '/', size = 'nav', showText = true }: BrandLogoProps) {
  const content = (
    <>
      <img className="brand-logo-image" src="/logo.png" alt="" width="220" height="124" />
      {showText && (
        <span className="brand-logo-copy">
          <b>DEVLIB</b>
          {size === 'nav' && <span>v04</span>}
        </span>
      )}
    </>
  );

  return (
    <Link to={to} className={`brand-logo brand-logo-${size}`} aria-label="DEVLIB · home">
      {content}
    </Link>
  );
}
