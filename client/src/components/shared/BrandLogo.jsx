import React from 'react';
import { Link } from 'react-router-dom';

const sizeMap = {
  xs: { mark: 'w-7 h-7 rounded-lg', text: 'text-sm', ring: 'inset-[3px]', spark: 'w-1.5 h-1.5' },
  sm: { mark: 'w-9 h-9 rounded-xl', text: 'text-lg', ring: 'inset-[4px]', spark: 'w-1.5 h-1.5' },
  md: { mark: 'w-11 h-11 rounded-2xl', text: 'text-xl', ring: 'inset-[5px]', spark: 'w-2 h-2' },
  lg: { mark: 'w-14 h-14 rounded-2xl', text: 'text-2xl', ring: 'inset-[6px]', spark: 'w-2.5 h-2.5' },
};

const BrandMark = ({ size = 'sm', className = '' }) => {
  const cfg = sizeMap[size] || sizeMap.sm;

  return (
    <div className={`relative ${cfg.mark} ${className}`}>
      <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(248,248,248,0.95)_4%,rgba(232,232,232,0.95)_58%,rgba(210,210,210,0.95)_100%)] shadow-[0_18px_34px_-24px_rgba(38,38,38,0.34)]" />
      <div className={`absolute ${cfg.ring} rounded-[inherit] border border-black/10 dark:border-white/20`} />
      <div className="absolute inset-[14%] rounded-[inherit] overflow-hidden flex items-center justify-center bg-white/85 dark:bg-black/20">
        <img src="/brand/avenor-mark.png" alt="Avenor" className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

const BrandText = ({ size = 'sm' }) => {
  const cfg = sizeMap[size] || sizeMap.sm;
  return (
    <span className={`font-display font-bold ${cfg.text} leading-none tracking-[-0.03em] text-[var(--color-text-primary)]`}>
      Avenor
    </span>
  );
};

const BrandLogo = ({
  size = 'sm',
  showText = true,
  asLink = false,
  to = '/',
  className = '',
  onClick,
}) => {
  const content = (
    <>
      <BrandMark size={size} />
      {showText && <BrandText size={size} />}
    </>
  );

  const common = `inline-flex items-center gap-2.5 group select-none ${className}`;

  if (asLink) {
    return (
      <Link to={to} className={common} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div className={common} onClick={onClick}>
      {content}
    </div>
  );
};

export default BrandLogo;
export { BrandMark };
