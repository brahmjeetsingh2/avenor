import React from 'react';

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const colors = [
  'from-primary-500 to-accent-500',
  'from-blue-500 to-primary-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-pink-500',
  'from-purple-500 to-indigo-500',
];

const getColor = (name) => {
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
};

const Avatar = ({
  src,
  name = '',
  size = 'md',
  className = '',
  online = false,
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover border-2 border-[var(--color-border)]`}
        />
      ) : (
        <div
          className={`
            ${sizes[size]} rounded-full
            bg-gradient-to-br ${getColor(name)}
            flex items-center justify-center
            font-bold text-white select-none
          `}
        >
          {initials || '?'}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success-500 rounded-full border-2 border-[var(--color-bg)]" />
      )}
    </div>
  );
};

export default Avatar;
