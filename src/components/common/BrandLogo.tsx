import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  className?: string;
  compact?: boolean;
}

export default function BrandLogo({ href = '/', className = '', compact = false }: BrandLogoProps) {
  const frameClass = compact ? 'h-14 w-[200px]' : 'h-28 w-[400px]';
  const zoomClass = compact ? 'scale-[2.0] translate-y-[6%]' : 'scale-[2.3] translate-y-[6%]';

  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="EduVi Home">
      <span className={`relative block overflow-hidden ${frameClass}`}>
        <img
          src="/image%20copy.png"
          alt="EDUVI"
          className={`h-full w-full object-contain ${zoomClass}`}
        />
      </span>
    </Link>
  );
}
