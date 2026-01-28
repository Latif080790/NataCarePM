# NataCarePM Design System Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Core Components](#core-components)
4. [Layout System](#layout-system)
5. [Navigation](#navigation)
6. [Typography](#typography)
7. [Color Palette](#color-palette)
8. [Best Practices](#best-practices)

---

## Overview

The NataCarePM Design System provides a comprehensive set of components and guidelines to ensure consistency, accessibility, and professional appearance across the entire application.

### Key Principles

- **Consistency**: All components follow the same visual language
- **Accessibility**: WCAG AA compliant with proper ARIA labels
- **Responsiveness**: Mobile-first design that works on all devices
- **Performance**: Optimized components with minimal re-renders
- **Developer Experience**: Easy to use with TypeScript support

---

## Design Tokens

### Color Palette

#### Primary Colors
```typescript
primary: {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
}
```

#### Semantic Colors
```typescript
semantic: {
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
}
```

#### Brand Colors
```typescript
accent-coral: '#FF6B6B',
accent-blue: '#4ECDC4',
accent-emerald: '#95E1D3',
alabaster: '#F8F9FA',
```

### Spacing Scale

```typescript
spacing: {
  'xs': '0.25rem',   // 4px
  'sm': '0.5rem',    // 8px
  'md': '1rem',      // 16px
  'lg': '1.5rem',    // 24px
  'xl': '2rem',      // 32px
  '2xl': '3rem',     // 48px
}
```

### Shadows

```typescript
boxShadow: {
  'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
  'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
  'strong': '0 8px 32px rgba(0, 0, 0, 0.12)',
  'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
  'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
}
```

---

## Core Components

### Import

All design system components can be imported from a single location:

```typescript
import {
  // Core Components
  CardPro,
  ButtonPro,
  BadgePro,
  TablePro,
  ModalPro,
  
  // Layout Components
  EnterpriseLayout,
  SectionLayout,
  GridLayout,
  
  // Navigation
  BreadcrumbPro,
  PageHeader,
  
  // State Components
  LoadingState,
  EmptyState,
  ErrorState,
  AlertPro,
} from '@/components/DesignSystem';
```

### CardPro

Professional card component for grouping related content.

```tsx
// Basic card
<CardPro>
  <CardProTitle>Card Title</CardProTitle>
  <CardProDescription>Card description</CardProDescription>
</CardPro>

// Card with header, content, and footer
<CardPro variant="elevated">
  <CardProHeader>
    <CardProTitle>Dashboard</CardProTitle>
  </CardProHeader>
  <CardProContent>
    <p>Main content</p>
  </CardProContent>
  <CardProFooter>
    <ButtonPro>Action</ButtonPro>
  </CardProFooter>
</CardPro>
```

**Variants**: `default | outlined | elevated | flat`
**Props**: `className`, `variant`, `padding`, `onClick`, `hoverable`

### ButtonPro

Accessible button component with multiple variants and sizes.

```tsx
// Primary button
<ButtonPro variant="primary">Save Changes</ButtonPro>

// Button with icon
<ButtonPro variant="primary" icon={Plus} iconPosition="left">
  Add New
</ButtonPro>

// Loading state
<ButtonPro variant="primary" isLoading={true}>
  Saving...
</ButtonPro>

// Button group
<ButtonProGroup>
  <ButtonPro variant="outline">Cancel</ButtonPro>
  <ButtonPro variant="primary">Save</ButtonPro>
</ButtonProGroup>
```

**Variants**: `primary | secondary | danger | ghost | outline`
**Sizes**: `sm | md | lg`
**Props**: `icon`, `iconPosition`, `isLoading`, `fullWidth`

### BadgePro

Status indicators and labels.

```tsx
// Basic badges
<BadgePro variant="success">Active</BadgePro>
<BadgePro variant="error">Error</BadgePro>

// Badge with icon
<BadgePro variant="primary" icon={Star}>Featured</BadgePro>

// Badge with dot
<BadgePro variant="success" dot>Online</BadgePro>

// Count badge
<BadgeCount count={5} variant="error" />

// Status badge with pulse
<BadgeStatus variant="success" pulse>Active</BadgeStatus>
```

**Variants**: `default | primary | success | warning | error | info`
**Sizes**: `sm | md | lg`

### TablePro

Enterprise-grade data table with built-in features.

```tsx
const columns: ColumnDef<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { 
    key: 'status', 
    header: 'Status', 
    render: (row) => <BadgePro>{row.status}</BadgePro>
  },
];

<TablePro
  data={users}
  columns={columns}
  searchable
  searchPlaceholder="Search users..."
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  hoverable
  striped
  stickyHeader
/>
```

**Features**: 
- Sorting
- Searching
- Mobile responsive (card view)
- Custom cell rendering
- Row click handling

### ModalPro

Accessible modal dialog with focus management.

```tsx
// Basic modal
<ModalPro
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Profile"
  size="lg"
>
  <p>Modal content</p>
</ModalPro>

// Confirmation modal
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Project"
  message="Are you sure? This action cannot be undone."
  confirmText="Delete"
  variant="danger"
/>
```

**Sizes**: `sm | md | lg | xl | full`
**Props**: `closeOnOverlay`, `closeOnEscape`, `showCloseButton`

---

## Layout System

### EnterpriseLayout

Standard page wrapper for consistent layout.

```tsx
<EnterpriseLayout
  title="Project Dashboard"
  subtitle="Monitor your project progress"
  breadcrumbs={[
    { label: 'Projects', href: '/projects' },
    { label: 'Dashboard' },
  ]}
  actions={
    <>
      <ButtonPro variant="outline">Export</ButtonPro>
      <ButtonPro variant="primary">New Task</ButtonPro>
    </>
  }
  maxWidth="7xl"
  background="gray"
>
  {/* Page content */}
</EnterpriseLayout>
```

**Max Widths**: `sm | md | lg | xl | 2xl | 7xl | full`
**Backgrounds**: `white | gray | gradient`

### SectionLayout

Content sections within a page.

```tsx
<SectionLayout
  title="Key Metrics"
  description="Overview of project performance"
  variant="card"
  actions={<ButtonPro>View All</ButtonPro>}
>
  {/* Section content */}
</SectionLayout>
```

**Variants**: `default | bordered | card`

### GridLayout

Responsive grid container.

```tsx
<GridLayout 
  columns={{ default: 1, md: 2, lg: 3 }} 
  gap="md"
>
  <CardPro>Item 1</CardPro>
  <CardPro>Item 2</CardPro>
  <CardPro>Item 3</CardPro>
</GridLayout>
```

---

## Navigation

### BreadcrumbPro

Navigation breadcrumbs.

```tsx
<BreadcrumbPro
  items={[
    { label: 'Dashboard', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Detail' },
  ]}
/>
```

### PageHeader

Combined header with breadcrumbs and actions.

```tsx
<PageHeader
  title="Project Dashboard"
  subtitle="Monitor your project progress"
  breadcrumbs={[...]}
  actions={<ButtonPro>Action</ButtonPro>}
/>
```

---

## Typography

### Headings

```tsx
<h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
<h2 className="text-2xl font-semibold text-gray-900">Section Title</h2>
<h3 className="text-xl font-semibold text-gray-900">Subsection Title</h3>
<h4 className="text-lg font-medium text-gray-900">Card Title</h4>
```

### Body Text

```tsx
<p className="text-base text-gray-700">Regular text</p>
<p className="text-sm text-gray-600">Small text</p>
<p className="text-xs text-gray-500">Extra small text</p>
```

---

## Best Practices

### 1. Layout Consistency

✅ **Do**: Use `EnterpriseLayout` for all full pages

```tsx
<EnterpriseLayout title="Page Title">
  <SectionLayout title="Section">
    {/* Content */}
  </SectionLayout>
</EnterpriseLayout>
```

❌ **Don't**: Create custom page layouts

### 2. Component Variants

✅ **Do**: Use semantic variants

```tsx
<ButtonPro variant="primary">Save</ButtonPro>
<ButtonPro variant="danger">Delete</ButtonPro>
```

❌ **Don't**: Create custom styles

```tsx
<button className="bg-blue-500 text-white">Save</button>
```

### 3. Spacing

✅ **Do**: Use consistent spacing classes

```tsx
<div className="space-y-6">
  <Section />
  <Section />
</div>
```

❌ **Don't**: Use arbitrary spacing

```tsx
<div style={{ marginBottom: '23px' }}>
```

### 4. Accessibility

✅ **Do**: Include proper labels

```tsx
<ButtonPro icon={Trash2} aria-label="Delete item">
  <span className="sr-only">Delete</span>
</ButtonPro>
```

### 5. Responsive Design

✅ **Do**: Use responsive utilities

```tsx
<GridLayout columns={{ default: 1, md: 2, lg: 3 }}>
```

❌ **Don't**: Fixed layouts

---

## Complete Example

Here's a complete example using the design system:

```tsx
import {
  EnterpriseLayout,
  SectionLayout,
  StatCardPro,
  StatCardGrid,
  TablePro,
  ButtonPro,
  BadgePro,
  ModalPro,
} from '@/components/DesignSystem';
import { Plus, Eye } from 'lucide-react';

export function ProjectView() {
  return (
    <EnterpriseLayout
      title="Projects"
      subtitle="Manage all your projects"
      breadcrumbs={[{ label: 'Projects' }]}
      actions={
        <ButtonPro variant="primary" icon={Plus}>
          New Project
        </ButtonPro>
      }
    >
      {/* Metrics */}
      <SectionLayout title="Overview" className="mb-8">
        <StatCardGrid>
          <StatCardPro
            title="Total Projects"
            value={24}
            icon={FileText}
            variant="primary"
          />
        </StatCardGrid>
      </SectionLayout>

      {/* Table */}
      <SectionLayout title="All Projects">
        <TablePro
          data={projects}
          columns={columns}
          searchable
          hoverable
        />
      </SectionLayout>
    </EnterpriseLayout>
  );
}
```

---

## Resources

- **Components**: `src/components/DesignSystem.tsx`
- **Tailwind Config**: `tailwind.config.cjs`
- **Design Tokens**: `src/styles/design-tokens.ts`

For questions or contributions, please refer to the project documentation.
