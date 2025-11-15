/**
 * JSX Runtime Preload
 * Forces Vite to bundle react/jsx-runtime into react-vendor chunk
 * This file is imported in index.tsx to ensure jsx functions are available
 */

// Explicitly import jsx-runtime to force bundling
export { jsx, jsxs, Fragment } from 'react/jsx-runtime';

// Re-export for contexts that need it
export { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
