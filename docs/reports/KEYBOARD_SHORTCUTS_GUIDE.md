# Keyboard Shortcuts Guide - NataCarePM

## Panduan Lengkap Keyboard Navigation & Shortcuts

### 🎯 Global Navigation

| Shortcut | Description |
|----------|-------------|
| `Alt + H` | Navigate to Home/Dashboard |
| `Alt + N` | Open Notifications |
| `Alt + S` | Focus Search/Command Palette |
| `Ctrl/Cmd + K` | Open Command Palette |
| `Esc` | Close modals/panels |
| `Tab` | Navigate forward through focusable elements |
| `Shift + Tab` | Navigate backward through focusable elements |

### 📊 Dashboard & Widgets

| Shortcut | Description |
|----------|-------------|
| `Ctrl/Cmd + R` | Refresh current widget/view |
| `Ctrl/Cmd + E` | Export current data |
| `Ctrl/Cmd + F` | Toggle fullscreen mode |
| `[` or `]` | Collapse/expand widget panels |
| `Ctrl/Cmd + ,` | Open settings |

### 📝 Forms & Input

| Shortcut | Description |
|----------|-------------|
| `Ctrl/Cmd + Enter` | Submit form |
| `Esc` | Clear/reset form |
| `Ctrl/Cmd + Z` | Undo input |
| `Ctrl/Cmd + Y` | Redo input |
| `Arrow Up/Down` | Navigate dropdown options |
| `Enter` | Select dropdown option |
| `Space` | Toggle checkbox/radio |

### 📋 Tables & Lists

| Shortcut | Description |
|----------|-------------|
| `Arrow Up/Down` | Navigate table rows |
| `Arrow Left/Right` | Navigate table columns |
| `Enter` | Select/open row |
| `Space` | Select/deselect row (multi-select) |
| `Ctrl/Cmd + A` | Select all rows |
| `Ctrl/Cmd + /` | Show/hide columns |
| `Home` | Jump to first row |
| `End` | Jump to last row |
| `Page Up/Down` | Navigate pages |

### 🎨 Modals & Overlays

| Shortcut | Description |
|----------|-------------|
| `Esc` | Close modal/overlay |
| `Tab` | Focus trap navigation (forward) |
| `Shift + Tab` | Focus trap navigation (backward) |
| `Enter` | Confirm action (primary button) |
| `Ctrl/Cmd + Enter` | Force submit/confirm |

### 📱 Mobile Accessibility

| Gesture | Description |
|---------|-------------|
| **Double Tap** | Activate element (screen readers) |
| **Swipe Right** | Next element (screen readers) |
| **Swipe Left** | Previous element (screen readers) |
| **Three-finger Swipe** | Scroll page |
| **Pinch/Zoom** | Adjust content size |

### 🔍 Search & Filtering

| Shortcut | Description |
|----------|-------------|
| `Ctrl/Cmd + F` | Focus global search |
| `Ctrl/Cmd + K` | Open command palette |
| `Arrow Up/Down` | Navigate search results |
| `Enter` | Select search result |
| `Esc` | Close search/clear filter |

### ♿ Screen Reader Support

#### **NVDA (Windows)**
- `NVDA + T` - Read page title
- `NVDA + F7` - Elements list
- `H` - Next heading
- `Shift + H` - Previous heading
- `K` - Next link
- `Shift + K` - Previous link
- `F` - Next form field
- `Shift + F` - Previous form field
- `T` - Next table
- `Shift + T` - Previous table

#### **JAWS (Windows)**
- `Insert + F5` - Form elements list
- `Insert + F6` - Headings list
- `Insert + F7` - Links list
- `;` - Next button
- `;` + `Shift` - Previous button

#### **VoiceOver (macOS/iOS)**
- `VO + A` - Start reading
- `VO + Command + H` - Next heading
- `VO + Command + L` - Next link
- `VO + Command + J` - Next form control
- `VO + Space` - Activate element

#### **TalkBack (Android)**
- **Swipe Right** - Next element
- **Swipe Left** - Previous element
- **Double Tap** - Activate
- **Swipe Up then Right** - Move to first item
- **Swipe Down then Left** - Move to last item

---

## 🛠️ Implementation Guide for Developers

### Adding Keyboard Shortcuts to Components

```tsx
import { useKeyboardShortcuts } from '@/utils/accessibility';

function MyComponent() {
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open command palette',
      action: () => setCommandPaletteOpen(true),
      global: true,
    },
    {
      key: 'Escape',
      description: 'Close modal',
      action: () => setModalOpen(false),
    },
  ]);

  return <div>...</div>;
}
```

### Implementing Focus Management

```tsx
import { useFocusManagement } from '@/utils/accessibility';

function NavigableList({ items }: { items: any[] }) {
  const { focusedIndex, handleArrowKeys } = useFocusManagement();

  return (
    <div onKeyDown={(e) => handleArrowKeys(e, items.length, 'vertical')}>
      {items.map((item, index) => (
        <button
          key={item.id}
          tabIndex={focusedIndex === index ? 0 : -1}
          aria-selected={focusedIndex === index}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
```

### Adding ARIA Labels

```tsx
import { generateAriaLabel, generateAriaDescription } from '@/utils/accessibility';

function AccessibleButton({ loading, error, disabled }: ButtonProps) {
  const ariaLabel = generateAriaLabel('Submit form', {
    loading,
    disabled,
    error,
  });

  const ariaDescription = generateAriaDescription(
    'This will save your changes',
    error ? 'Please fix validation errors first' : undefined
  );

  return (
    <button
      aria-label={ariaLabel}
      aria-describedby={ariaDescription ? 'button-desc' : undefined}
      aria-busy={loading}
    >
      Submit
      {ariaDescription && <span id="button-desc" className="sr-only">{ariaDescription}</span>}
    </button>
  );
}
```

### Screen Reader Announcements

```tsx
import { announceToScreenReader } from '@/utils/accessibility';

function handleSave() {
  // Save logic...
  announceToScreenReader('Form saved successfully', 'polite');
}

function handleError() {
  // Error logic...
  announceToScreenReader('Error: Failed to save form', 'assertive');
}
```

---

## ✅ WCAG 2.1 AA Compliance Checklist

### Perceivable
- [x] Text alternatives for non-text content
- [x] Captions and alternatives for multimedia
- [x] Adaptable content (can be presented in different ways)
- [x] Distinguishable (color contrast ratio ≥ 4.5:1)

### Operable
- [x] Keyboard accessible (all functionality via keyboard)
- [x] Enough time (adjustable time limits)
- [x] Seizures and physical reactions (no flashing content)
- [x] Navigable (skip links, page titles, focus order)
- [x] Input modalities (pointer gestures, motion actuation)

### Understandable
- [x] Readable (language identification, unusual words explained)
- [x] Predictable (consistent navigation, consistent identification)
- [x] Input assistance (error identification, labels, error prevention)

### Robust
- [x] Compatible (parsing, name/role/value for all UI components)
- [x] Status messages (screen reader announcements)

---

## 📚 Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **Axe DevTools**: https://www.deque.com/axe/devtools/
- **NVDA Screen Reader**: https://www.nvaccess.org/
- **WebAIM**: https://webaim.org/

---

## 🧪 Testing Accessibility

### Automated Testing (Axe DevTools)
```bash
npm install -D @axe-core/react
```

### Keyboard Navigation Test
1. Disconnect mouse
2. Navigate entire app using only keyboard
3. Verify all interactive elements are reachable
4. Check focus indicators are visible
5. Test form submission with Enter key

### Screen Reader Test
1. **Windows**: Enable NVDA or JAWS
2. **macOS**: Enable VoiceOver (Cmd + F5)
3. **Mobile**: Enable TalkBack (Android) or VoiceOver (iOS)
4. Navigate through app and verify all content is announced
5. Test form inputs, buttons, links, and dynamic content

### Color Contrast Test
```tsx
import { checkColorContrast } from '@/utils/accessibility';

const contrast = checkColorContrast('#F87941', '#FDFCFC');
console.log(`Contrast ratio: ${contrast.ratio}`);
console.log(`Passes WCAG AA: ${contrast.passesAA}`);
```

---

**Last Updated**: November 2025  
**Maintained by**: NataCarePM Accessibility Team
