import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 space-y-4 animate-pulse">
      <div className="w-full h-44 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 space-y-4 animate-pulse">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 border-t border-slate-100 dark:border-slate-700/40 pt-3">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-3 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const BannerSkeleton = () => {
  return (
    <div className="w-full h-72 sm:h-96 bg-slate-200 dark:bg-slate-700 rounded-3xl animate-pulse flex items-center px-8 sm:px-16">
      <div className="space-y-4 w-full max-w-md">
        <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-3/4" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2" />
        <div className="h-10 bg-slate-300 dark:bg-slate-600 rounded-lg w-1/3" />
      </div>
    </div>
  );
};
