import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordView from '@/views/ForgotPasswordView';
import * as firebaseAuth from 'firebase/auth';

// Mock firebase sendPasswordResetEmail
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendPasswordResetEmail: vi.fn(),
  };
});

// Basic test suite for ForgotPasswordView flow
// Covers: render, validation error, success path, failure path

describe('ForgotPasswordView flow', () => {
  const mockSend = firebaseAuth.sendPasswordResetEmail as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderView = () => render(<ForgotPasswordView onBack={() => { /* noop */ }} />);

  it('renders form and elements', () => {
    renderView();
    expect(screen.getByText('Lupa Password')).toBeInTheDocument();
    // Button should be enabled initially (no email yet but form allows attempt) - adjust expectation
    expect(screen.getByRole('button', { name: /kirim link reset/i })).toBeEnabled();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email format', async () => {
    renderView();
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    const submitBtn = screen.getByRole('button', { name: /kirim link reset/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Our component renders exact error message from schema (likely in Indonesian)
      const errorMsg = screen.getByTestId('email-error-msg');
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg.textContent?.toLowerCase()).toMatch(/email/i);
    });
  });

  it('submits and shows success state for valid email', async () => {
    mockSend.mockResolvedValueOnce(undefined);
    renderView();
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /kirim link reset/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalled();
      expect(screen.getByText('Email Terkirim')).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
    });
  });

  it('handles firebase user-not-found error with friendly message', async () => {
    mockSend.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    renderView();
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'missing@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /kirim link reset/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalled();
      expect(screen.getByText(/email tidak terdaftar/i)).toBeInTheDocument();
    });
  });

  it('handles generic error path', async () => {
    mockSend.mockRejectedValueOnce({ code: 'auth/unknown-error' });
    renderView();
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'user2@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /kirim link reset/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalled();
      expect(screen.getByText(/gagal mengirim email reset password/i)).toBeInTheDocument();
    });
  });
});
