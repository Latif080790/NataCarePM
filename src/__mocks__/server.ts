/**
 * MSW Server Setup for Node.js (Jest Tests)
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup server with handlers
export const server = setupServer(...handlers);

// Server lifecycle hooks for testing
export const setupMSW = () => {
  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());

  // Clean up after all tests
  afterAll(() => server.close());
};
