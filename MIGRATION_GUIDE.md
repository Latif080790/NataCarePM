# Migration Guide: Old Views → Design System

## 📋 Overview

This guide will help you migrate existing views to use the new Design System components for consistency, better UX, and maintainability.

---

## 🔄 Migration Checklist

### Before You Start
- [ ] Read `DESIGN_SYSTEM_GUIDE.md`
- [ ] Review example views: `TasksViewPro.tsx`, `FinanceViewPro.tsx`, `ReportsViewPro.tsx`
- [ ] Understand component imports from `DesignSystem.tsx`

### During Migration
- [ ] Replace custom layouts with `EnterpriseLayout`
- [ ] Use `CardPro` instead of custom card divs
- [ ] Replace button elements with `ButtonPro`
- [ ] Use `TablePro` for data tables
- [ ] Add proper breadcrumbs with `BreadcrumbPro`
- [ ] Implement loading states with `LoadingState`
- [ ] Use `EmptyState` for no-data scenarios
- [ ] Add mobile FAB where appropriate

### After Migration
- [ ] Test on desktop, tablet, and mobile
- [ ] Verify accessibility with keyboard navigation
- [ ] Check all loading states
- [ ] Ensure consistent spacing

---

## 🎯 Step-by-Step Migration

### Step 1: Update Imports

**Before:**
```typescript
import { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
```

**After:**
```typescript
import { useState } from 'react';
import {
  EnterpriseLayout,
  SectionLayout,
  CardPro,
  ButtonPro,
  BadgePro,
  TablePro,
  LoadingState,
  EmptyState,
} from '@/components/DesignSystem';
```

---

### Step 2: Replace Page Layout

**Before:**
```typescript
export function MyView() {
  return (
    <div className="p-6">
      <h1>My Page</h1>
      <div className="mt-6">
        {/* Content */}
      </div>
    </div>
  );
}
```

**After:**
```typescript
export function MyView() {
  return (
    <EnterpriseLayout
      title="My Page"
      subtitle="Page description here"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'My Page' },
      ]}
      actions={
        <ButtonPro variant="primary" icon={Plus}>
          New Item
        </ButtonPro>
      }
    >
      <SectionLayout title="Section Title">
        {/* Content */}
      </SectionLayout>
    </EnterpriseLayout>
  );
}
```

---

### Step 3: Replace Cards

**Before:**
```typescript
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-bold mb-4">Card Title</h3>
  <p>Card content</p>
  <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
    Action
  </button>
</div>
```

**After:**
```typescript
<CardPro variant="elevated">
  <CardProHeader>
    <CardProTitle>Card Title</CardProTitle>
  </CardProHeader>
  <CardProContent>
    <p>Card content</p>
  </CardProContent>
  <CardProFooter>
    <ButtonPro variant="primary">Action</ButtonPro>
  </CardProFooter>
</CardPro>
```

---

### Step 4: Replace Buttons

**Before:**
```typescript
<button 
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
  onClick={handleClick}
>
  Save
</button>
```

**After:**
```typescript
<ButtonPro 
  variant="primary" 
  onClick={handleClick}
>
  Save
</ButtonPro>

// With icon
<ButtonPro 
  variant="primary" 
  icon={Save}
  onClick={handleClick}
>
  Save
</ButtonPro>

// Loading state
<ButtonPro 
  variant="primary" 
  isLoading={isSaving}
  onClick={handleClick}
>
  Save
</ButtonPro>
```

---

### Step 5: Replace Tables

**Before:**
```typescript
<table className="w-full">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {data.map(item => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.email}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**After:**
```typescript
const columns: ColumnDef<User>[] = [
  { 
    key: 'name', 
    header: 'Name', 
    sortable: true 
  },
  { 
    key: 'email', 
    header: 'Email', 
    sortable: true 
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <BadgePro variant={row.active ? 'success' : 'default'}>
        {row.active ? 'Active' : 'Inactive'}
      </BadgePro>
    ),
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
/>
```

---

### Step 6: Add Loading States

**Before:**
```typescript
{isLoading ? (
  <div className="flex justify-center p-12">
    <div className="spinner"></div>
  </div>
) : (
  <div>{content}</div>
)}
```

**After:**
```typescript
{isLoading ? (
  <LoadingState message="Loading data..." size="lg" />
) : (
  <div>{content}</div>
)}
```

---

### Step 7: Add Empty States

**Before:**
```typescript
{data.length === 0 && (
  <div className="text-center py-12 text-gray-500">
    No data found
  </div>
)}
```

**After:**
```typescript
{data.length === 0 && (
  <EmptyState
    icon={FileText}
    title="No Data Found"
    description="Get started by adding your first item."
    action={
      <ButtonPro variant="primary" icon={Plus} onClick={handleCreate}>
        Add Item
      </ButtonPro>
    }
  />
)}
```

---

### Step 8: Add Stat Cards (Metrics)

**Before:**
```typescript
<div className="grid grid-cols-4 gap-4">
  <div className="bg-white p-4 rounded shadow">
    <p className="text-gray-600">Total</p>
    <p className="text-2xl font-bold">{total}</p>
  </div>
  {/* More metrics... */}
</div>
```

**After:**
```typescript
<SectionLayout title="Overview">
  <StatCardGrid>
    <StatCardPro
      title="Total Items"
      value={total}
      icon={FileText}
      variant="primary"
      description="All items"
    />
    <StatCardPro
      title="Active"
      value={active}
      icon={CheckCircle}
      variant="success"
      trend={{ value: 12, label: 'vs last month' }}
    />
    {/* More cards... */}
  </StatCardGrid>
</SectionLayout>
```

---

### Step 9: Add Breadcrumbs

**Before:**
```typescript
// No breadcrumbs
```

**After:**
```typescript
// Automatic via EnterpriseLayout
<EnterpriseLayout
  title="Page Title"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Section', href: '/section' },
    { label: 'Current Page' },
  ]}
>
```

---

### Step 10: Add Mobile FAB

**After (new feature):**
```typescript
import { FAB, FABMenu } from '@/components/DesignSystem';

// Simple FAB
<FAB
  icon={Plus}
  label="Add new item"
  onClick={() => setShowCreateModal(true)}
  variant="primary"
/>

// FAB with menu
<FABMenu
  mainIcon={Plus}
  mainLabel="Create new"
  items={[
    { icon: FileText, label: 'New Report', onClick: () => {} },
    { icon: Users, label: 'New Task', onClick: () => {} },
  ]}
/>
```

---

## 📊 Real-World Example

### Before Migration (Old TasksView.tsx)

```typescript
export function TasksView({ tasks }) {
  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setShowCreate(true)}
        >
          New Task
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Total</p>
          <p className="text-2xl font-bold">{tasks.length}</p>
        </div>
        {/* More metrics */}
      </div>

      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>
                  <span className={`px-2 py-1 rounded ${
                    task.status === 'done' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100'
                  }`}>
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### After Migration (TasksViewPro.tsx)

```typescript
import {
  EnterpriseLayout,
  SectionLayout,
  StatCardPro,
  StatCardGrid,
  TablePro,
  ColumnDef,
  ButtonPro,
  BadgePro,
  FAB,
} from '@/components/DesignSystem';
import { Plus, CheckCircle, Clock } from 'lucide-react';

export function TasksViewPro({ tasks }) {
  const completed = tasks.filter(t => t.status === 'done').length;

  const columns: ColumnDef<Task>[] = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => (
        <BadgePro variant={task.status === 'done' ? 'success' : 'default'}>
          {task.status}
        </BadgePro>
      ),
    },
  ];

  return (
    <EnterpriseLayout
      title="Tasks"
      subtitle="Manage project tasks"
      breadcrumbs={[
        { label: 'Projects', href: '/' },
        { label: 'Tasks' },
      ]}
      actions={
        <ButtonPro variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>
          New Task
        </ButtonPro>
      }
    >
      {/* Metrics */}
      <SectionLayout title="Overview" className="mb-8">
        <StatCardGrid>
          <StatCardPro
            title="Total Tasks"
            value={tasks.length}
            icon={CheckCircle}
            variant="primary"
          />
          <StatCardPro
            title="Completed"
            value={completed}
            icon={CheckCircle}
            variant="success"
            trend={{ value: 85, label: 'completion rate' }}
          />
        </StatCardGrid>
      </SectionLayout>

      {/* Table */}
      <SectionLayout title="All Tasks">
        <TablePro
          data={tasks}
          columns={columns}
          searchable
          searchPlaceholder="Search tasks..."
          hoverable
          striped
        />
      </SectionLayout>

      {/* Mobile FAB */}
      <FAB
        icon={Plus}
        label="New task"
        onClick={() => setShowCreate(true)}
      />
    </EnterpriseLayout>
  );
}
```

---

## 🎨 Common Patterns

### Pattern 1: Metrics Dashboard

```typescript
<SectionLayout title="Key Metrics">
  <StatCardGrid>
    <StatCardPro title="..." value="..." icon={Icon} variant="primary" />
    <StatCardPro title="..." value="..." icon={Icon} variant="success" />
  </StatCardGrid>
</SectionLayout>
```

### Pattern 2: Data List with Actions

```typescript
<SectionLayout 
  title="Items" 
  actions={<ButtonPro variant="primary" icon={Plus}>Add</ButtonPro>}
>
  <TablePro
    data={items}
    columns={columns}
    searchable
    onRowClick={handleRowClick}
  />
</SectionLayout>
```

### Pattern 3: Card Grid

```typescript
<SectionLayout title="Items">
  <GridLayout columns={{ default: 1, md: 2, lg: 3 }}>
    {items.map(item => (
      <CardPro key={item.id} hoverable>
        <CardProHeader>
          <CardProTitle>{item.title}</CardProTitle>
        </CardProHeader>
        <CardProContent>
          {item.description}
        </CardProContent>
      </CardPro>
    ))}
  </GridLayout>
</SectionLayout>
```

---

## ✅ Migration Checklist for Each View

```markdown
View: _______________

- [ ] Import from DesignSystem.tsx
- [ ] Wrap with EnterpriseLayout
- [ ] Add breadcrumbs
- [ ] Add page title and subtitle
- [ ] Replace custom cards with CardPro
- [ ] Replace buttons with ButtonPro
- [ ] Replace tables with TablePro
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error states
- [ ] Add stat cards if applicable
- [ ] Add mobile FAB if applicable
- [ ] Test on mobile
- [ ] Test keyboard navigation
- [ ] Verify accessibility
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Mix Old and New Components

**Bad:**
```typescript
<EnterpriseLayout title="Page">
  <div className="bg-white p-4 rounded shadow">  {/* Old style */}
    <ButtonPro>Action</ButtonPro>  {/* New component */}
  </div>
</EnterpriseLayout>
```

**Good:**
```typescript
<EnterpriseLayout title="Page">
  <CardPro>  {/* New component */}
    <ButtonPro>Action</ButtonPro>  {/* New component */}
  </CardPro>
</EnterpriseLayout>
```

### ❌ Don't Create Custom Layouts

**Bad:**
```typescript
<div className="max-w-7xl mx-auto px-6 py-8">
  {/* Custom layout */}
</div>
```

**Good:**
```typescript
<EnterpriseLayout maxWidth="7xl" padding="md">
  {/* Use EnterpriseLayout */}
</EnterpriseLayout>
```

### ❌ Don't Forget Mobile

**Bad:**
```typescript
// Only desktop view, no FAB
```

**Good:**
```typescript
// Desktop actions + Mobile FAB
<EnterpriseLayout
  actions={<ButtonPro>Action</ButtonPro>}  {/* Desktop */}
>
  {/* Content */}
  <FAB icon={Plus} onClick={handleAction} />  {/* Mobile */}
</EnterpriseLayout>
```

---

## 📞 Need Help?

1. Check `DESIGN_SYSTEM_GUIDE.md`
2. Review example views: `TasksViewPro.tsx`, `FinanceViewPro.tsx`
3. Look at component source code in `src/components/`
4. Ask team for code review

Happy migrating! 🚀
