import React from 'react';

const SkeletonCard = () => (
  <div className="bg-slate-800 p-4 rounded-lg animate-pulse">
    <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
    <div className="h-8 bg-slate-700 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-slate-700 rounded w-1/4"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-slate-800 p-4 rounded-lg animate-pulse">
    <div className="h-64 bg-slate-700 rounded"></div>
  </div>
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-4 bg-slate-700 rounded w-48 mb-3 animate-pulse"></div>
          <div className="h-8 bg-slate-600 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex space-x-4">
            <div className="h-10 bg-slate-700 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-slate-700 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* S-Curve Skeleton */}
      <SkeletonChart />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Lower Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <SkeletonChart />
        </div>
        <div className="lg:col-span-2">
            <SkeletonChart />
        </div>
      </div>
    </div>
  );
};
