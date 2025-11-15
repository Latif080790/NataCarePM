import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from './Button';

interface BreadcrumbItem {
  name: string;
  id?: string;
  onClick?: () => void;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function BreadcrumbNavigation({ items, className = '' }: BreadcrumbNavigationProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => items[0]?.onClick?.()}
        className="p-1 h-auto text-palladium hover:text-night-black"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Button>

      {items.map((item, index) => (
        <React.Fragment key={item.id || index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-palladium" />}

          {index === items.length - 1 ? (
            // Current page - not clickable
            <span className="font-semibold text-night-black px-2 py-1 rounded-lg glass-subtle">
              {item.name}
            </span>
          ) : (
            // Previous pages - clickable
            <Button
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              className="px-2 py-1 h-auto text-palladium hover:text-night-black hover:bg-violet-essence/10 rounded-lg transition-all duration-200"
            >
              {item.name}
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

