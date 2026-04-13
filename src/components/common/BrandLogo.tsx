import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  className?: string;
  compact?: boolean;
}

export default function BrandLogo({ href = '/', className = '', compact = false }: BrandLogoProps) {
  const frameClass = compact ? 'h-12 w-[176px]' : 'h-24 w-[340px]';
  const zoomClass = compact ? 'scale-[2.45]' : 'scale-[2.55]';

  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="EduVi Home">
      <span className={`relative block overflow-hidden ${frameClass}`}>
        <img
          src="/image%20copy.png"
          alt="EDUVI"
          className={`h-full w-full object-contain object-center ${zoomClass}`}
        />
      </span>
    </Link>
  );
}
