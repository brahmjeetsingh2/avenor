import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
  onClick,
  ...props
}) => {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

  return (
    <div
      onClick={onClick}
      className={`
        card
        ${paddings[padding]}
        ${hover ? 'card-interactive transition-all duration-300 cursor-pointer' : ''}
        ${glow ? 'card-selected' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
