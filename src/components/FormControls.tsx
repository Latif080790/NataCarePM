import * as React from 'react';
import DOMPurify from 'dompurify';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
  sanitizeLevel?: 'basic' | 'strict';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, sanitize = false, sanitizeLevel = 'basic', onChange, ...props }, ref) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (sanitize && e.target.value && onChange) {
          // Sanitize using DOMPurify (removes dangerous HTML/XSS)
          const sanitized = DOMPurify.sanitize(e.target.value, {
            ALLOWED_TAGS: [], // Strip all HTML tags
            KEEP_CONTENT: true, // Keep text content
          });
          
          // Create new event with sanitized value
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: sanitized,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          
          // Call onChange with sanitized value
          onChange(syntheticEvent);
        } else if (onChange) {
          // Call onChange without sanitization
          onChange(e);
        }
      },
      [sanitize, sanitizeLevel, onChange]
    );

    return (
      <input
        className={`flex h-10 w-full rounded-md border border-violet-essence bg-white px-3 py-2 text-sm text-night-black placeholder:text-palladium focus:outline-none focus:ring-2 focus:ring-persimmon focus:border-persimmon disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        onChange={handleChange}
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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  sanitize?: boolean;
  sanitizeLevel?: 'basic' | 'strict';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, sanitize = false, sanitizeLevel = 'basic', onChange, ...props }, ref) => {
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (sanitize && e.target.value && onChange) {
          // Sanitize using DOMPurify
          const sanitized = DOMPurify.sanitize(e.target.value, {
            ALLOWED_TAGS: [], // Strip all HTML tags
            KEEP_CONTENT: true, // Keep text content
          });
          
          // Create new event with sanitized value
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: sanitized,
            },
          } as React.ChangeEvent<HTMLTextAreaElement>;
          
          // Call onChange with sanitized value
          onChange(syntheticEvent);
        } else if (onChange) {
          // Call onChange without sanitization
          onChange(e);
        }
      },
      [sanitize, sanitizeLevel, onChange]
    );

    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded-md border border-violet-essence bg-white px-3 py-2 text-sm text-night-black placeholder:text-palladium focus:outline-none focus:ring-2 focus:ring-persimmon focus:border-persimmon disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Select, Textarea };

