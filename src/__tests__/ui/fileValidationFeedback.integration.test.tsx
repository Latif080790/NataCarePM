/**
 * 🧪 TDD Feature 2: File Validation UI Feedback Integration Tests
 * 
 * RED PHASE - Write Failing Tests First
 * 
 * User Story:
 * As a user uploading files, I want clear visual feedback about validation errors
 * so that I know exactly what's wrong and can fix it easily.
 * 
 * Features to test:
 * 1. Visual error indicators for invalid files
 * 2. File size warnings with formatted display
 * 3. Success icons for valid files
 * 4. Upload prevention when validation fails
 * 5. Multiple error messages display
 * 6. User-friendly error text
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileValidationFeedback from '@/components/FileValidationFeedback';
import { validateFile } from '@/utils/fileValidation';

describe('File Validation UI Feedback', () => {
  // ==========================================
  // 1. VISUAL ERROR INDICATORS
  // ==========================================
  describe('Error Display', () => {
    it('should display error icon for invalid file type', () => {
      // Create file with dangerous extension (.exe)
      const invalidFile = new File(['malicious content'], 'virus.exe', {
        type: 'application/x-msdownload',
      });

      const validationResult = validateFile(invalidFile);

      // Render FileValidationFeedback component
      render(
        <FileValidationFeedback 
          file={invalidFile} 
          validationResult={validationResult} 
        />
      );

      // Should show error icon (❌ or similar)
      const errorIcon = screen.getByTestId('validation-error-icon');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('text-red-500'); // Red color

      // Should display error message
      expect(screen.getByText(/tidak diizinkan karena alasan keamanan/i)).toBeInTheDocument();
    });

    it('should display error message for oversized file', () => {
      // Create file larger than 10MB
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large-document.pdf', {
        type: 'application/pdf',
      });

      const validationResult = validateFile(largeFile);

      render(
        <FileValidationFeedback 
          file={largeFile} 
          validationResult={validationResult} 
        />
      );

      // Should show error icon
      expect(screen.getByTestId('validation-error-icon')).toBeInTheDocument();

      // Should display formatted file size (in error message, not metadata)
      expect(screen.getByTestId('validation-error-message')).toHaveTextContent(/11.*MB/i);
      expect(screen.getByText(/melebihi batas maksimal/i)).toBeInTheDocument();
    });

    it('should display error for empty file', () => {
      const emptyFile = new File([], 'empty.pdf', {
        type: 'application/pdf',
      });

      const validationResult = validateFile(emptyFile);

      render(
        <FileValidationFeedback 
          file={emptyFile} 
          validationResult={validationResult} 
        />
      );

      expect(screen.getByTestId('validation-error-icon')).toBeInTheDocument();
      expect(screen.getByText(/kosong tidak diperbolehkan/i)).toBeInTheDocument();
    });

    it('should display error for file with malicious filename', () => {
      const maliciousFile = new File(['content'], '../../../etc/passwd', {
        type: 'text/plain',
      });

      const validationResult = validateFile(maliciousFile);

      render(
        <FileValidationFeedback 
          file={maliciousFile} 
          validationResult={validationResult} 
        />
      );

      expect(screen.getByTestId('validation-error-icon')).toBeInTheDocument();
      expect(screen.getByText(/karakter yang tidak diperbolehkan/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // 2. FILE SIZE WARNINGS
  // ==========================================
  describe('File Size Warnings', () => {
    it('should display warning icon for large images', () => {
      // Create large image file (6MB - valid but warned)
      const largeImage = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large-photo.jpg', {
        type: 'image/jpeg',
      });

      const validationResult = validateFile(largeImage);

      render(
        <FileValidationFeedback 
          file={largeImage} 
          validationResult={validationResult} 
        />
      );

      // Should show warning icon (⚠️ or similar)
      const warningIcon = screen.getByTestId('validation-warning-icon');
      expect(warningIcon).toBeInTheDocument();
      expect(warningIcon).toHaveClass('text-yellow-500'); // Yellow color

      // Should display warning message
      expect(screen.getByText(/pertimbangkan untuk mengompresnya/i)).toBeInTheDocument();
    });

    it('should format file size correctly (MB, KB, Bytes)', () => {
      const files = [
        { size: 1024, expected: '1 KB' },
        { size: 1024 * 1024, expected: '1 MB' },
        { size: 2.5 * 1024 * 1024, expected: '2.5 MB' },
      ];

      files.forEach(({ size, expected }) => {
        const file = new File([new ArrayBuffer(size)], 'test.pdf', {
          type: 'application/pdf',
        });

        const { container } = render(
          <FileValidationFeedback 
            file={file} 
            validationResult={{ valid: true }} 
          />
        );

        expect(container.textContent).toContain(expected);
      });
    });
  });

  // ==========================================
  // 3. SUCCESS INDICATORS
  // ==========================================
  describe('Success Indicators', () => {
    it('should display success icon for valid file', () => {
      const validFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const validationResult = validateFile(validFile);

      render(
        <FileValidationFeedback 
          file={validFile} 
          validationResult={validationResult} 
        />
      );

      // Should show success icon (✓ or similar)
      const successIcon = screen.getByTestId('validation-success-icon');
      expect(successIcon).toBeInTheDocument();
      expect(successIcon).toHaveClass('text-green-500'); // Green color
    });

    it('should show "Ready to upload" message for valid files', () => {
      const validFile = new File(['content'], 'report.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const validationResult = validateFile(validFile);

      render(
        <FileValidationFeedback 
          file={validFile} 
          validationResult={validationResult} 
        />
      );

      expect(screen.getByText(/siap untuk diunggah/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // 4. UPLOAD PREVENTION
  // ==========================================
  describe('Upload Prevention', () => {
    it('should disable upload button when file is invalid', () => {
      const invalidFile = new File(['content'], 'virus.exe', {
        type: 'application/x-msdownload',
      });

      const validationResult = validateFile(invalidFile);
      const onUpload = vi.fn();

      render(
        <FileValidationFeedback 
          file={invalidFile} 
          validationResult={validationResult} 
          onUpload={onUpload}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toBeDisabled();

      // Click should not trigger upload
      fireEvent.click(uploadButton);
      expect(onUpload).not.toHaveBeenCalled();
    });

    it('should enable upload button when file is valid', () => {
      const validFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const validationResult = validateFile(validFile);
      const onUpload = vi.fn();

      render(
        <FileValidationFeedback 
          file={validFile} 
          validationResult={validationResult} 
          onUpload={onUpload}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toBeEnabled();

      // Click should trigger upload
      fireEvent.click(uploadButton);
      expect(onUpload).toHaveBeenCalledTimes(1);
    });

    it('should allow upload with warnings but not errors', () => {
      // Large image (has warning but is valid)
      const largeImage = new File([new ArrayBuffer(6 * 1024 * 1024)], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const validationResult = validateFile(largeImage);
      const onUpload = vi.fn();

      render(
        <FileValidationFeedback 
          file={largeImage} 
          validationResult={validationResult} 
          onUpload={onUpload}
        />
      );

      // Should show warning but button should be enabled
      expect(screen.getByTestId('validation-warning-icon')).toBeInTheDocument();
      
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toBeEnabled();
    });
  });

  // ==========================================
  // 5. MULTIPLE ERRORS DISPLAY
  // ==========================================
  describe('Multiple Validation Issues', () => {
    it('should display all validation errors in a list', () => {
      // File with multiple issues (invalid type AND oversized)
      const problematicFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)], 
        'bad-file.xyz', // Unsupported extension
        { type: 'application/octet-stream' }
      );

      const validationResult = validateFile(problematicFile);

      render(
        <FileValidationFeedback 
          file={problematicFile} 
          validationResult={validationResult} 
        />
      );

      // Should show primary error
      expect(screen.getByTestId('validation-error-icon')).toBeInTheDocument();
      
      // Should display the error message
      const errorMessage = screen.getByTestId('validation-error-message');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should display warnings separately from errors', () => {
      // Valid file with warnings
      const fileWithWarnings = new File(
        [new ArrayBuffer(6 * 1024 * 1024)], 
        'large-image.jpg', 
        { type: 'image/jpeg' }
      );

      const validationResult = validateFile(fileWithWarnings);

      render(
        <FileValidationFeedback 
          file={fileWithWarnings} 
          validationResult={validationResult} 
        />
      );

      // Should show warning section
      const warningSection = screen.getByTestId('validation-warnings');
      expect(warningSection).toBeInTheDocument();

      // Should list each warning
      const warningList = within(warningSection).getByRole('list');
      expect(warningList.children.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 6. USER-FRIENDLY MESSAGES
  // ==========================================
  describe('User-Friendly Error Messages', () => {
    it('should provide actionable feedback for file type errors', () => {
      const invalidFile = new File(['content'], 'document.xyz', {
        type: 'application/octet-stream',
      });

      const validationResult = validateFile(invalidFile);

      render(
        <FileValidationFeedback 
          file={invalidFile} 
          validationResult={validationResult} 
          showHelp={true}
        />
      );

      // Should show help text
      expect(screen.getByText(/tipe file yang diizinkan/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF, DOCX, XLSX, JPG, PNG/i)).toBeInTheDocument();
    });

    it('should suggest compression for large files', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      const validationResult = validateFile(largeFile);

      render(
        <FileValidationFeedback 
          file={largeFile} 
          validationResult={validationResult} 
          showHelp={true}
        />
      );

      // Should suggest solutions
      expect(screen.getByText(/kompres file/i)).toBeInTheDocument();
      expect(screen.getByText(/maksimal 10 MB/i)).toBeInTheDocument();
    });

    it('should display file metadata (name, size, type)', () => {
      const file = new File([new ArrayBuffer(1024)], 'test-document.pdf', {
        type: 'application/pdf',
      });

      render(
        <FileValidationFeedback 
          file={file} 
          validationResult={{ valid: true }} 
        />
      );

      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      expect(screen.getByText(/1 KB/i)).toBeInTheDocument();
      // Check for file type badge specifically
      const fileTypeBadge = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'span' && 
               element?.className.includes('bg-gray-100') &&
               content === 'PDF';
      });
      expect(fileTypeBadge).toBeInTheDocument();
    });
  });
});

