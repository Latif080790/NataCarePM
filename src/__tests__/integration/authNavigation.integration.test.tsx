import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnterpriseLoginView from '@/views/EnterpriseLoginView';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('@/firebaseConfig', () => ({
  auth: {},
  db: {},
}));

const mockLogin = vi.fn();
const mockClearError = vi.fn();

const mockAuthState: any = {
  loading: false,
  login: mockLogin,
  error: null,
  clearError: mockClearError,
  currentUser: null,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.stubGlobal('IntersectionObserver', class {
  observe() {}
  disconnect() {}
  unobserve() {}
});

/**
 * Integration test suite for authentication navigation flows.
 * Covers: EnterpriseLoginView ↔ ForgotPasswordView transitions.
 */
describe('Auth Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.error = null;
    mockAuthState.loading = false;
  });

  it('navigates to ForgotPasswordView when clicking "Forgot password?" link', async () => {
    const user = userEvent.setup();

    render(<EnterpriseLoginView />);

    // Initially on login view
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.queryByText('Lupa Password')).not.toBeInTheDocument();

    // Click forgot password link
    const forgotLink = screen.getByRole('button', { name: /forgot your password/i });
    await user.click(forgotLink);

    // Should now show ForgotPasswordView
    await waitFor(() => {
      expect(screen.getByText('Lupa Password')).toBeInTheDocument();
      expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
    });
  });

  it('navigates back to login from ForgotPasswordView when clicking back button', async () => {
    const user = userEvent.setup();

    render(<EnterpriseLoginView />);

    // Navigate to forgot password
    const forgotLink = screen.getByRole('button', { name: /forgot your password/i });
    await user.click(forgotLink);

    await waitFor(() => {
      expect(screen.getByText('Lupa Password')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByRole('button', { name: /kembali ke login/i });
    await user.click(backButton);

    // Should return to login view
    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.queryByText('Lupa Password')).not.toBeInTheDocument();
    });
  });

  it('clears auth errors when navigating to ForgotPasswordView', async () => {
    const user = userEvent.setup();
    mockAuthState.error = 'Invalid credentials';

    render(<EnterpriseLoginView />);

    // Error should be visible on login view
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();

    // Navigate to forgot password
    const forgotLink = screen.getByRole('button', { name: /forgot your password/i });
    await user.click(forgotLink);

    // clearError should have been called
    expect(mockClearError).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Lupa Password')).toBeInTheDocument();
    });
  });

  it('clears auth errors when navigating back from ForgotPasswordView', async () => {
    const user = userEvent.setup();

    render(<EnterpriseLoginView />);

    // Navigate to forgot password
    const forgotLink = screen.getByRole('button', { name: /forgot your password/i });
    await user.click(forgotLink);

    await waitFor(() => {
      expect(screen.getByText('Lupa Password')).toBeInTheDocument();
    });

    vi.clearAllMocks(); // Reset mock call counts

    // Navigate back
    const backButton = screen.getByRole('button', { name: /kembali ke login/i });
    await user.click(backButton);

    // clearError should have been called on back navigation
    expect(mockClearError).toHaveBeenCalled();
  });

  it('preserves form state when navigating away and back (login → forgot → back)', async () => {
    const user = userEvent.setup();

    render(<EnterpriseLoginView />);

    // Fill in email on login form
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    // Navigate away
    const forgotLink = screen.getByRole('button', { name: /forgot your password/i });
    await user.click(forgotLink);

    await waitFor(() => {
      expect(screen.getByText('Lupa Password')).toBeInTheDocument();
    });

    // Navigate back
    const backButton = screen.getByRole('button', { name: /kembali ke login/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    // Form state IS preserved (UX feature: user doesn't lose input when navigating back)
    // Component uses conditional rendering, not unmounting, so React preserves input state
    const loginEmailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    expect(loginEmailInput.value).toBe('test@example.com');
  });
});
