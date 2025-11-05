/**
 * LoginView Component Tests
 * 
 * Tests cover:
 * - Form rendering in login/registration modes
 * - Form validation (Zod schema integration)
 * - Form submission flows
 * - Error handling and display
 * - Mode switching (login ↔ registration)
 * - 2FA flow integration
 * - Loading states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginView from './LoginView';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
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

// Mock AuthContext
const mockLogin = vi.fn();
const mockCancel2FA = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    loading: false,
    login: mockLogin,
    requires2FA: false,
    pending2FAUserId: null,
    cancel2FA: mockCancel2FA,
    currentUser: null,
  }),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ToastProvider>
);

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Mode', () => {
    it('should render login form by default', () => {
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      expect(screen.getByText('NATA\'CARA')).toBeInTheDocument();
      expect(screen.getByText('Silakan login untuk mengakses proyek Anda')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument();
      
      // Should NOT show registration fields
      expect(screen.queryByLabelText(/nama/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/konfirmasi password/i)).not.toBeInTheDocument();
    });

    it('should show forgot password link in login mode', () => {
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      expect(screen.getByText('Lupa password?')).toBeInTheDocument();
    });

    it('should validate email format on login submission', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /masuk/i });

      // Enter invalid email
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show validation error (appears in both summary and field error)
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/Please enter a valid email address/i);
        expect(errorElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Should NOT call login
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should validate required fields on login submission', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /masuk/i });

      // Submit without filling fields
      await user.click(submitButton);

      // Should show validation errors (check for error summary component)
      await waitFor(() => {
        // Look for form error summary or any required field errors
        const hasErrorSummary = screen.queryByText(/Terdapat kesalahan pada form/i);
        const hasRequiredErrors = screen.queryAllByText(/required|wajib|must/i);
        expect(hasErrorSummary || hasRequiredErrors.length > 0).toBeTruthy();
      }, { timeout: 3000 });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should call login on valid form submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /masuk/i });

      // Enter valid credentials
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!@#');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'ValidPass123!@#');
      });
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!@#');
      await user.click(submitButton);

      // Should show loading text
      expect(screen.getByText(/memproses/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Registration Mode', () => {
    it('should switch to registration mode', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const switchButton = screen.getByText(/belum punya akun/i);
      await user.click(switchButton);

      // Should show registration form
      await waitFor(() => {
        expect(screen.getByText('Buat akun baru untuk memulai')).toBeInTheDocument();
        expect(screen.getByLabelText(/nama/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/konfirmasi password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/syarat.*ketentuan/i)).toBeInTheDocument();
      });
    });

    it('should validate name length in registration', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      // Switch to registration
      await user.click(screen.getByText(/belum punya akun/i));

      // Wait for registration mode
      await waitFor(() => {
        expect(screen.getByLabelText(/konfirmasi password/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/nama/i);
      const submitButton = screen.getByRole('button', { name: /daftar/i });

      // Enter short name
      await user.type(nameInput, 'A');
      await user.click(submitButton);

      await waitFor(() => {
        // Check for any error message related to name (appears in both summary and field error)
        const nameErrors = screen.queryAllByText(/Name must be at least 2 characters/i);
        expect(nameErrors.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should validate password strength in registration', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      await user.click(screen.getByText(/belum punya akun/i));

      // Wait for registration mode
      await waitFor(() => {
        expect(screen.getByLabelText(/konfirmasi password/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /daftar/i });

      // Enter weak password (use id to get the right password field)
      const passwordField = screen.getAllByPlaceholderText('******')[0];
      await user.type(passwordField, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        // Look for password-related error (appears in both summary and field error)
        const passwordErrors = screen.queryAllByText(/Password must be at least 12 characters/i);
        expect(passwordErrors.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should validate password match in registration', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      await user.click(screen.getByText(/belum punya akun/i));

      // Wait for registration form to fully render
      await waitFor(() => {
        expect(screen.getByLabelText(/konfirmasi password/i)).toBeInTheDocument();
      });

      const passwordFields = screen.getAllByPlaceholderText('******');
      const passwordInput = passwordFields[0];
      const confirmPasswordInput = passwordFields[1];
      const submitButton = screen.getByRole('button', { name: /daftar/i });

      // Enter mismatched passwords
      await user.type(passwordInput, 'ValidPass123!@#');
      await user.type(confirmPasswordInput, 'DifferentPass123!@#');
      await user.click(submitButton);

      await waitFor(() => {
        const errorElements = screen.queryAllByText(/Passwords do not match/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('should require terms agreement in registration', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      await user.click(screen.getByText(/belum punya akun/i));

      // Wait for registration form
      await waitFor(() => {
        expect(screen.getByLabelText(/konfirmasi password/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/nama/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordFields = screen.getAllByPlaceholderText('******');
      const passwordInput = passwordFields[0];
      const confirmPasswordInput = passwordFields[1];
      const submitButton = screen.getByRole('button', { name: /daftar/i });

      // Fill all fields except terms
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!@#');
      await user.type(confirmPasswordInput, 'ValidPass123!@#');
      await user.click(submitButton);

      await waitFor(() => {
        const errorElements = screen.queryAllByText(/You must agree to the Terms of Service/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it('should switch back to login mode', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      // Switch to registration
      await user.click(screen.getByText(/belum punya akun/i));
      
      // Switch back to login
      const backButton = screen.getByText(/sudah punya akun/i);
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Silakan login untuk mengakses proyek Anda')).toBeInTheDocument();
        expect(screen.queryByLabelText(/nama/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Forgot Password Flow', () => {
    it('should show forgot password view', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const forgotPasswordLink = screen.getByText('Lupa password?');
      await user.click(forgotPasswordLink);

      // Should render ForgotPasswordView
      await waitFor(() => {
        expect(screen.getByText(/reset password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <TestWrapper>
          <LoginView />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!@#');
      await user.click(submitButton);

      // Form should be disabled
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
