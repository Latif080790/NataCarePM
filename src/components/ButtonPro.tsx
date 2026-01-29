import { Button } from './Button';
import type { ButtonProps } from './Button';

/**
 * @deprecated ButtonPro is deprecated. Please use Button component instead.
 * This component is now an alias for Button.
 */
export const ButtonPro = Button;

/**
 * @deprecated Use ButtonProps instead.
 */
export type ButtonProProps = ButtonProps;

export const ButtonProGroup = ({ children, className = '', orientation = 'horizontal' }: any) => {
  const orientationStyles =
    orientation === 'horizontal'
      ? 'flex flex-row gap-2'
      : 'flex flex-col gap-2';

  return (
    <div className={`${orientationStyles} ${className}`}>
      {children}
    </div>
  );
};
