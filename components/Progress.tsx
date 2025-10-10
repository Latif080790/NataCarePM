

import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
}

// FIX: Refactored function signature to resolve a spurious type error.
// The component now accepts a single `props` object and destructures it internally,
// which can help with type inference issues.
export function Progress(props: ProgressProps) {
  const { value, className, ...rest } = props;
  const normalizedValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-violet-essence/50 ${className}`}
      {...rest}
    >
      <div
        className="h-full w-full flex-1 bg-persimmon transition-all"
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      />
    </div>
  );
}