import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription
} from './Card';

import type { CardProps } from './Card';

/**
 * @deprecated CardPro is deprecated. Please use Card component instead.
 * This component is now an alias for Card.
 */
export const CardPro = Card;

export const CardProHeader = CardHeader;
export const CardProContent = CardContent;
export const CardProFooter = CardFooter;
export const CardProTitle = CardTitle;
export const CardProDescription = CardDescription;

/**
 * @deprecated Use CardProps instead.
 */
export type CardProProps = CardProps;

// Types for subcomponents to ensure compatibility
export interface CardProHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }
export interface CardProContentProps extends React.HTMLAttributes<HTMLDivElement> { }
export interface CardProFooterProps extends React.HTMLAttributes<HTMLDivElement> { }
