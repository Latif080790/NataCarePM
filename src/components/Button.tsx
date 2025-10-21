import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'secondary'
    | 'link'
    | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-precious-persimmon/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group';

    const variantClasses = {
      default:
        'glass-subtle border border-violet-essence/20 text-night-black hover:border-violet-essence/40 hover:shadow-lg hover:scale-105 backdrop-blur-sm',
      primary:
        'gradient-bg-primary text-white hover:shadow-lg hover:scale-105 border border-precious-persimmon/20',
      destructive:
        'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:scale-105 border border-red-400/20',
      outline:
        'border-2 border-violet-essence/30 bg-transparent text-night-black hover:bg-violet-essence/10 hover:border-violet-essence hover:scale-105',
      secondary:
        'bg-violet-essence/20 text-night-black hover:bg-violet-essence/30 hover:shadow-md hover:scale-105 border border-violet-essence/20',
      ghost: 'text-night-black hover:bg-violet-essence/10 hover:scale-105',
      link: 'text-precious-persimmon underline-offset-4 hover:underline hover:scale-105',
      gradient:
        'gradient-bg-secondary text-white hover:shadow-xl hover:scale-105 border border-no-way-rose/20',
    };

    const sizeClasses = {
      default: 'h-11 px-6 py-3',
      sm: 'h-9 rounded-lg px-4 text-xs',
      lg: 'h-12 rounded-xl px-8 text-base',
      xl: 'h-14 rounded-2xl px-10 text-lg',
      icon: 'h-11 w-11',
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;

    const LoadingSpinner = () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

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
      <button className={combinedClasses} ref={ref} disabled={loading || props.disabled} {...props}>
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

        {loading && <LoadingSpinner />}

        <span
          className={`relative z-10 flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        >
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
