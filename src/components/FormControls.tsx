import * as React from 'react';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`flex h-10 w-full rounded-md border border-violet-essence bg-white px-3 py-2 text-sm text-night-black placeholder:text-palladium focus:outline-none focus:ring-2 focus:ring-persimmon focus:border-persimmon disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={`flex h-10 w-full items-center justify-between rounded-md border border-violet-essence bg-white px-3 py-2 text-sm text-night-black focus:outline-none focus:ring-2 focus:ring-persimmon focus:border-persimmon disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-violet-essence bg-white px-3 py-2 text-sm text-night-black placeholder:text-palladium focus:outline-none focus:ring-2 focus:ring-persimmon focus:border-persimmon disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Input, Select, Textarea };
