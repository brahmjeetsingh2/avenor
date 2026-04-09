import React from 'react';

const Skeleton = ({ className = '', rounded = 'rounded-lg' }) => (
  <div className={`skeleton ${rounded} ${className}`} />
);

export const CompanyCardSkeleton = () => (
  <div className="card p-5 space-y-4 shadow-[var(--shadow-soft)]">
    <div className="flex items-start gap-3">
      <Skeleton className="w-12 h-12 shrink-0" rounded="rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-16 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-20" rounded="rounded-full" />
      <Skeleton className="h-6 w-16" rounded="rounded-full" />
    </div>
    <div className="flex justify-between items-center pt-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" rounded="rounded-xl" />
    </div>
  </div>
);

export const CompanyDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="card p-6 space-y-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 shrink-0" rounded="rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-24" rounded="rounded-full" />
            <Skeleton className="h-6 w-20" rounded="rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
    <div className="card p-6 shadow-[var(--shadow-soft)]">
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);

export default Skeleton;
