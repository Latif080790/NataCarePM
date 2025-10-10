
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variantClasses = {
      default: 'bg-persimmon text-white hover:bg-persimmon/90',
      destructive: 'bg-red-500 text-white hover:bg-red-500/90',
      outline: 'border border-violet-essence bg-transparent hover:bg-violet-essence/50',
      secondary: 'bg-violet-essence text-night-black hover:bg-violet-essence/80',
      ghost: 'hover:bg-violet-essence/50',
      link: 'text-persimmon underline-offset-4 hover:underline',
    };

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;

    if (asChild) {
      // FIX: Explicitly type child as React.ReactElement<any> to prevent props from being inferred as `unknown`.
      // This resolves errors with accessing `child.props.className` and passing `ref` to `React.cloneElement`.
      const child = React.Children.only(children) as React.ReactElement<any>;
      return React.cloneElement(child, {
        className: `${combinedClasses} ${child.props.className || ''}`,
        ...props,
        ref,
      });
    }

    return (
      <button
        className={combinedClasses}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
