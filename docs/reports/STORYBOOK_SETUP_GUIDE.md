# Storybook Setup Guide - NataCarePM

## 🎨 Interactive Component Documentation

Storybook provides visual documentation and interactive testing for all 40+ design system components.

## 📦 Installation

```bash
npx storybook@latest init
```

This will:
- Install Storybook 7 dependencies
- Configure Vite integration
- Create `.storybook/` directory
- Add example stories in `src/stories/`

## 🔧 Configuration

### `.storybook/main.ts`

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Accessibility testing
    '@storybook/addon-viewport', // Responsive testing
    '@storybook/addon-backgrounds', // Background themes
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': '/src',
        },
      },
    };
  },
};

export default config;
```

### `.storybook/preview.ts`

```typescript
import type { Preview } from '@storybook/react';
import '../src/index.css'; // Import Tailwind styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FDFCFC' },
        { name: 'dark', value: '#2F3035' },
        { name: 'violet', value: '#E6E4E6' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1920px', height: '1080px' } },
      },
    },
  },
};

export default preview;
```

## 📝 Example Stories

### Button Component Story

Create `src/components/ButtonPro.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonPro } from './ButtonPro';
import { Download, Plus, RefreshCw } from 'lucide-react';

const meta: Meta<typeof ButtonPro> = {
  title: 'Design System/ButtonPro',
  component: ButtonPro,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enterprise-grade button component with multiple variants, sizes, and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonPro>;

// Primary variant
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

// With icon
export const WithIcon: Story = {
  args: {
    variant: 'primary',
    leftIcon: <Download className="w-4 h-4" />,
    children: 'Download',
  },
};

// Loading state
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Processing...',
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ButtonPro variant="primary">Primary</ButtonPro>
      <ButtonPro variant="secondary">Secondary</ButtonPro>
      <ButtonPro variant="outline">Outline</ButtonPro>
      <ButtonPro variant="ghost">Ghost</ButtonPro>
      <ButtonPro variant="danger">Danger</ButtonPro>
    </div>
  ),
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ButtonPro size="sm">Small</ButtonPro>
      <ButtonPro size="md">Medium</ButtonPro>
      <ButtonPro size="lg">Large</ButtonPro>
    </div>
  ),
};

// Interactive example
export const Interactive: Story = {
  args: {
    variant: 'primary',
    leftIcon: <RefreshCw className="w-4 h-4" />,
    children: 'Refresh Data',
  },
  play: async ({ canvasElement }) => {
    // Add interaction tests here if needed
  },
};
```

### Card Component Story

Create `src/components/CardPro.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { 
  CardPro, 
  CardProHeader, 
  CardProContent, 
  CardProFooter, 
  CardProTitle,
  CardProDescription 
} from './CardPro';
import { ButtonPro } from './ButtonPro';

const meta: Meta<typeof CardPro> = {
  title: 'Design System/CardPro',
  component: CardPro,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CardPro>;

export const Default: Story = {
  render: () => (
    <CardPro className="w-[400px]">
      <CardProHeader>
        <CardProTitle>Project Progress</CardProTitle>
        <CardProDescription>Track your project milestones</CardProDescription>
      </CardProHeader>
      <CardProContent>
        <p className="text-body-small visual-secondary">
          Your project is 75% complete with 3 tasks remaining.
        </p>
      </CardProContent>
      <CardProFooter>
        <ButtonPro variant="outline" size="sm">Cancel</ButtonPro>
        <ButtonPro variant="primary" size="sm">Continue</ButtonPro>
      </CardProFooter>
    </CardPro>
  ),
};

export const WithHover: Story = {
  render: () => (
    <CardPro className="w-[400px]" hover>
      <CardProContent>
        <p className="text-heading-4 visual-primary mb-2">Hover Effect</p>
        <p className="text-body-small visual-secondary">
          This card has hover effects enabled
        </p>
      </CardProContent>
    </CardPro>
  ),
};
```

### Form Components Story

Create `src/components/InputPro.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { InputPro } from './InputPro';
import { Search, User, Lock } from 'lucide-react';

const meta: Meta<typeof InputPro> = {
  title: 'Design System/Forms/InputPro',
  component: InputPro,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InputPro>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search projects...',
    leftIcon: <Search className="w-4 h-4" />,
  },
};

export const WithValidation: Story = {
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    required: true,
    minLength: 3,
    maxLength: 20,
    showCounter: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    error: 'Password must be at least 8 characters',
    leftIcon: <Lock className="w-4 h-4" />,
  },
};

export const Loading: Story = {
  args: {
    label: 'Project Name',
    placeholder: 'Loading...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Read Only Field',
    placeholder: 'This field is disabled',
    disabled: true,
    value: 'Cannot edit this',
  },
};
```

### Widget Stories

Create `src/components/DashboardWidgets.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { StatWidget, ChartWidget, ListWidget, MetricWidget } from './DashboardWidgets';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const meta: Meta<typeof StatWidget> = {
  title: 'Design System/Widgets',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const StatWidgetExample: StoryObj<typeof StatWidget> = {
  render: () => (
    <StatWidget
      id="stat-1"
      title="Total Revenue"
      data={{
        value: '$124,500',
        label: 'This month',
        trend: {
          direction: 'up',
          value: 12.5,
          label: 'vs last month',
        },
        icon: <DollarSign className="w-8 h-8" />,
        color: '#F87941',
      }}
    />
  ),
};

export const MetricWidgetExample: StoryObj<typeof MetricWidget> = {
  render: () => (
    <MetricWidget
      id="metric-1"
      title="Project Progress"
      data={{
        current: 750,
        target: 1000,
        unit: 'tasks',
        label: 'Tasks completed',
        color: '#10b981',
      }}
    />
  ),
};

export const ListWidgetExample: StoryObj<typeof ListWidget> = {
  render: () => (
    <ListWidget
      id="list-1"
      title="Recent Activities"
      items={[
        {
          id: '1',
          title: 'Project Alpha completed',
          subtitle: '2 hours ago',
          value: '100%',
          icon: <TrendingUp className="w-5 h-5" />,
          color: '#10b981',
        },
        {
          id: '2',
          title: 'New team member added',
          subtitle: '5 hours ago',
          badge: 'New',
          icon: <Users className="w-5 h-5" />,
          color: '#3b82f6',
        },
      ]}
    />
  ),
};
```

## 🚀 Running Storybook

```bash
# Development mode
npm run storybook

# Build static Storybook
npm run build-storybook
```

## 📊 Component Coverage

### Core Components (10)
- ✅ ButtonPro
- ✅ CardPro
- ✅ BadgePro
- ✅ TablePro
- ✅ ModalPro
- ✅ SpinnerPro
- ✅ AlertPro
- ✅ StatCardPro
- ✅ BreadcrumbPro
- ✅ EnterpriseLayout

### Form Components (3)
- ✅ InputPro
- ⏳ SelectPro (TODO)
- ⏳ DatePickerPro (TODO)

### Advanced Components (8)
- ✅ CommandPalettePro
- ✅ TableProAdvanced
- ✅ ToastPro
- ✅ ThemeSwitcher
- ✅ ChartPro
- ✅ WidgetContainer
- ✅ StatWidget
- ✅ MetricWidget

### Mobile Components (2)
- ✅ FAB
- ✅ FABMenu

## 🧪 Addon Features

### Accessibility Testing
```typescript
// Automatically checks WCAG compliance
export const AccessibleButton: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

### Responsive Testing
```typescript
// Test on different viewports
export const ResponsiveCard: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};
```

### Dark Mode Testing
```typescript
// Test with different backgrounds
export const DarkModeButton: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};
```

## 📚 Documentation Structure

```
.storybook/
  ├── main.ts           # Storybook configuration
  ├── preview.ts        # Global decorators & parameters
  └── manager.ts        # UI customization

src/
  ├── components/
  │   ├── ButtonPro.stories.tsx
  │   ├── CardPro.stories.tsx
  │   ├── InputPro.stories.tsx
  │   └── ...
  └── stories/
      ├── Introduction.mdx
      ├── Colors.mdx
      ├── Typography.mdx
      └── Icons.mdx
```

## 🎯 Next Steps

1. **Install Storybook**
   ```bash
   npx storybook@latest init
   ```

2. **Create Stories** for all 40+ components

3. **Add Interactions** using `@storybook/addon-interactions`

4. **Deploy Storybook** to Netlify or GitHub Pages:
   ```bash
   npm run build-storybook
   # Deploy the storybook-static/ directory
   ```

5. **Integrate with CI/CD** for visual regression testing

## 🔗 Resources

- **Storybook Docs**: https://storybook.js.org/docs/react/get-started/introduction
- **Addons Catalog**: https://storybook.js.org/addons
- **Best Practices**: https://storybook.js.org/docs/react/writing-stories/introduction

---

**Status**: Ready for implementation  
**Estimated Time**: 2-3 days for all components  
**Priority**: Medium
