import { Badge } from './Badge';
import { BadgeProps } from './Badge';

/**
 * @deprecated BadgePro is deprecated. Use Badge component instead.
 */
export const BadgePro = Badge;
export type BadgeProProps = BadgeProps;

export function BadgeCount({
  count,
  max = 99,
  variant = 'error',
  className = '',
}: {
  count: number;
  max?: number;
  variant?: any;
  className?: string;
}) {
  const displayCount = count > max ? `${max}+` : count.toString();

  if (count === 0) return null;

  return (
    <Badge variant={variant} size="sm" className={className}>
      {displayCount}
    </Badge>
  );
}

export function BadgeStatus({
  children,
  variant = 'success',
  pulse = false,
  className = '',
}: {
  children: React.ReactNode;
  variant?: any;
  pulse?: boolean;
  className?: string;
}) {
  // Map BadgeStatus variants to Badge variants if necessary
  return (
    <Badge variant={variant} pulse={pulse} className={className}>
      {children}
    </Badge>
  );
}
