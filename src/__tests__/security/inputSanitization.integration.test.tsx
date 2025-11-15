/**
 * Input Sanitization Integration Tests
 * TDD Approach: Write tests first, then implement
 * 
 * Goal: Integrate sanitizationService with FormControls components
 * to automatically sanitize user input and prevent XSS attacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Textarea } from '@/components/FormControls';
import { sanitizeInput } from '@/utils/sanitization';

describe('Input Sanitization Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // XSS ATTACK PREVENTION
  // ============================================================================

  describe('XSS Attack Prevention', () => {
    it('should sanitize script tags in Input component', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} sanitize />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '<script>alert("XSS")</script>');
      
      // Expect sanitized value without script tags
      expect(handleChange).toHaveBeenCalled();
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).not.toContain('<script>');
      expect(sanitizedValue).not.toContain('alert');
    });

    it('should sanitize img onerror XSS in Input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} sanitize />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '<img src=x onerror="alert(1)">');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).not.toContain('onerror');
      expect(sanitizedValue).not.toContain('alert');
    });

    it('should sanitize javascript: protocol in Input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} sanitize />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '<a href="javascript:alert(1)">Click</a>');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).not.toContain('javascript:');
    });

    it('should sanitize iframe injection in Textarea', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Textarea onChange={handleChange} sanitize />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '<iframe src="evil.com"></iframe>');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).not.toContain('<iframe');
    });

    it('should sanitize event handler attributes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} sanitize />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '<div onclick="alert(1)">Test</div>');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).not.toContain('onclick');
    });
  });

  // ============================================================================
  // VALID CONTENT PRESERVATION
  // ============================================================================

  describe('Valid Content Preservation', () => {
    it('should preserve valid text without HTML', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} sanitize />);
      
      const input = screen.getByRole('textbox');
      const validText = 'Hello World 123';
      await user.type(input, validText);
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).toContain('Hello World 123');
    });

    it('should preserve valid email addresses', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input type="email" onChange={handleChange} sanitize />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'user@example.com');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).toBe('user@example.com');
    });

    it('should preserve numbers and decimals', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input type="text" onChange={handleChange} sanitize />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '1234.56');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).toBe('1234.56');
    });
  });

  // ============================================================================
  // SANITIZATION OPTIONS
  // ============================================================================

  describe('Sanitization Options', () => {
    it('should not sanitize when sanitize prop is false', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} sanitize={false} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '<b>Bold</b>');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const value = lastCall[0].target.value;
      
      expect(value).toBe('<b>Bold</b>'); // Not sanitized
    });

    it('should not sanitize when sanitize prop is not provided', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '<i>Italic</i>');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const value = lastCall[0].target.value;
      
      expect(value).toBe('<i>Italic</i>'); // Not sanitized by default
    });
  });

  // ============================================================================
  // TEXTAREA SPECIFIC TESTS
  // ============================================================================

  describe('Textarea Sanitization', () => {
    it('should sanitize multiline script injection', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Textarea onChange={handleChange} sanitize />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Line 1{Enter}<script>alert(1)</script>{Enter}Line 3');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).not.toContain('<script>');
      expect(sanitizedValue).toContain('Line 1');
      expect(sanitizedValue).toContain('Line 3');
    });

    it('should preserve line breaks in Textarea', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Textarea onChange={handleChange} sanitize />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');
      
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const sanitizedValue = lastCall[0].target.value;
      
      expect(sanitizedValue).toContain('\n');
    });
  });
});

