import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  user?: {
    display_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-base font-bold',
  xl: 'h-16 w-16 text-xl font-black',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  email,
  size = 'md',
  className = '',
  fallbackClassName = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const effectiveSrc = src !== undefined ? src : user?.avatar_url;
  const effectiveName = name || user?.display_name || user?.email?.split('@')[0] || '';
  const effectiveEmail = email || user?.email || '';

  // Reset error status if the src changes
  useEffect(() => {
    setImageError(false);
  }, [effectiveSrc]);

  const initial = (effectiveName || effectiveEmail || 'U').charAt(0).toUpperCase();
  const dimensionClass = sizeClasses[size] || sizeClasses.md;

  if (effectiveSrc && !imageError) {
    return (
      <img
        src={effectiveSrc}
        alt={effectiveName || 'User avatar'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImageError(true)}
        className={`rounded-full object-cover shrink-0 select-none shadow-sm ${dimensionClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 select-none border border-border/60 shadow-sm ${dimensionClass} ${fallbackClassName} ${className}`}
      title={effectiveName ? `${effectiveName} (${effectiveEmail})` : effectiveEmail}
    >
      {initial}
    </div>
  );
};
