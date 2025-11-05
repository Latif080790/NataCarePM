/**
 * FormFields Component Tests
 * 
 * Tests cover:
 * - FormField (text, email, password, tel, url, number inputs)
 * - TextareaField
 * - SelectField
 * - FormErrorSummary
 * - Error display and accessibility
 * - Helper text display
 * - Required field indicators
 * - Disabled states
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { FormField, TextareaField, SelectField, FormErrorSummary } from './FormFields';

// Test wrapper component with react-hook-form
function TestFormField(props: {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  defaultValues?: any;
  errors?: any;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}) {
  const { register, formState: { errors: formErrors } } = useForm({
    defaultValues: props.defaultValues || { testField: '' },
  });

  // Use provided errors or form errors
  const errors = props.errors || formErrors;

  return (
    <FormField
      name="testField"
      label={props.label || 'Test Field'}
      type={props.type}
      register={register}
      errors={errors}
      required={props.required}
      disabled={props.disabled}
      helpText={props.helpText}
      placeholder="Test placeholder"
    />
  );
}

function TestTextareaField(props: {
  defaultValues?: any;
  errors?: any;
  rows?: number;
  label?: string;
  required?: boolean;
  helpText?: string;
}) {
  const { register, formState: { errors: formErrors } } = useForm({
    defaultValues: props.defaultValues || { testTextarea: '' },
  });

  const errors = props.errors || formErrors;

  return (
    <TextareaField
      name="testTextarea"
      label={props.label || 'Test Textarea'}
      register={register}
      errors={errors}
      rows={props.rows}
      required={props.required}
      helpText={props.helpText}
      placeholder="Test textarea placeholder"
    />
  );
}

function TestSelectField(props: {
  defaultValues?: any;
  errors?: any;
  options: Array<{ value: string | number; label: string }>;
  label?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const { register, formState: { errors: formErrors } } = useForm({
    defaultValues: props.defaultValues || { testSelect: '' },
  });

  const errors = props.errors || formErrors;

  return (
    <SelectField
      name="testSelect"
      label={props.label || 'Test Select'}
      options={props.options}
      register={register}
      errors={errors}
      required={props.required}
      placeholder={props.placeholder}
    />
  );
}

describe('FormFields Components', () => {
  describe('FormField', () => {
    it('should render text input by default', () => {
      render(<TestFormField />);
      
      const input = screen.getByLabelText('Test Field');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render with different input types', () => {
      const types: Array<'text' | 'email' | 'password' | 'tel' | 'url' | 'number'> = [
        'email', 'password', 'tel', 'url', 'number'
      ];

      types.forEach(type => {
        const { unmount } = render(<TestFormField type={type} label={`Test ${type}`} />);
        const input = screen.getByLabelText(`Test ${type}`);
        expect(input).toHaveAttribute('type', type);
        unmount();
      });
    });

    it('should display label', () => {
      render(<TestFormField label="Email Address" />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(<TestFormField label="Required Field" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should show placeholder', () => {
      render(<TestFormField />);
      expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<TestFormField disabled />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toBeDisabled();
    });

    it('should display help text when no errors', () => {
      render(<TestFormField helpText="This is helpful text" />);
      expect(screen.getByText('This is helpful text')).toBeInTheDocument();
    });

    it('should display error message when field has error', () => {
      const errors = {
        testField: { message: 'This field is required' },
      };
      
      render(<TestFormField errors={errors} />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error styling when field has error', () => {
      const errors = {
        testField: { message: 'Error' },
      };
      
      render(<TestFormField errors={errors} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveClass('border-red-500');
    });

    it('should set aria-invalid when field has error', () => {
      const errors = {
        testField: { message: 'Error' },
      };
      
      render(<TestFormField errors={errors} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should link error message with aria-describedby', () => {
      const errors = {
        testField: { message: 'Error message' },
      };
      
      render(<TestFormField errors={errors} />);
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('aria-describedby', 'testField-error');
      expect(screen.getByText('Error message')).toHaveAttribute('id', 'testField-error');
    });

    it('should hide help text when error is present', () => {
      const errors = {
        testField: { message: 'Error message' },
      };
      
      render(<TestFormField errors={errors} helpText="Help text" />);
      expect(screen.queryByText('Help text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('TextareaField', () => {
    it('should render textarea element', () => {
      render(<TestTextareaField />);
      
      const textarea = screen.getByLabelText('Test Textarea');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should display label', () => {
      render(<TestTextareaField label="Description" />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(<TestTextareaField required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should set rows attribute', () => {
      render(<TestTextareaField rows={10} />);
      const textarea = screen.getByLabelText('Test Textarea');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    it('should have default rows of 4', () => {
      render(<TestTextareaField />);
      const textarea = screen.getByLabelText('Test Textarea');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('should display error message', () => {
      const errors = {
        testTextarea: { message: 'Textarea error' },
      };
      
      render(<TestTextareaField errors={errors} />);
      expect(screen.getByText('Textarea error')).toBeInTheDocument();
    });

    it('should apply error styling', () => {
      const errors = {
        testTextarea: { message: 'Error' },
      };
      
      render(<TestTextareaField errors={errors} />);
      const textarea = screen.getByLabelText('Test Textarea');
      expect(textarea).toHaveClass('border-red-500');
    });

    it('should display help text when no errors', () => {
      render(<TestTextareaField helpText="Enter detailed description" />);
      expect(screen.getByText('Enter detailed description')).toBeInTheDocument();
    });
  });

  describe('SelectField', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    it('should render select element', () => {
      render(<TestSelectField options={options} />);
      
      const select = screen.getByLabelText('Test Select');
      expect(select.tagName).toBe('SELECT');
    });

    it('should display label', () => {
      render(<TestSelectField options={options} label="Status" />);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(<TestSelectField options={options} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render all options', () => {
      render(<TestSelectField options={options} />);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should render placeholder option when provided', () => {
      render(<TestSelectField options={options} placeholder="-- Select --" />);
      
      expect(screen.getByText('-- Select --')).toBeInTheDocument();
      const placeholderOption = screen.getByText('-- Select --') as HTMLOptionElement;
      expect(placeholderOption.value).toBe('');
    });

    it('should render options with correct values', () => {
      render(<TestSelectField options={options} />);
      
      const select = screen.getByLabelText('Test Select') as HTMLSelectElement;
      const optionElements = Array.from(select.options);
      
      expect(optionElements).toHaveLength(3);
      expect(optionElements[0].value).toBe('option1');
      expect(optionElements[1].value).toBe('option2');
      expect(optionElements[2].value).toBe('option3');
    });

    it('should handle numeric option values', () => {
      const numericOptions = [
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
      ];
      
      render(<TestSelectField options={numericOptions} />);
      
      const select = screen.getByLabelText('Test Select') as HTMLSelectElement;
      expect(select.options[0].value).toBe('1');
      expect(select.options[1].value).toBe('2');
    });

    it('should display error message', () => {
      const errors = {
        testSelect: { message: 'Selection required' },
      };
      
      render(<TestSelectField options={options} errors={errors} />);
      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('should apply error styling', () => {
      const errors = {
        testSelect: { message: 'Error' },
      };
      
      render(<TestSelectField options={options} errors={errors} />);
      const select = screen.getByLabelText('Test Select');
      expect(select).toHaveClass('border-red-500');
    });
  });

  describe('FormErrorSummary', () => {
    it('should not render when there are no errors', () => {
      const { container } = render(<FormErrorSummary errors={{} as FieldErrors} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render error summary with default title', () => {
      const errors = {
        field1: { message: 'Error 1', type: 'required' },
        field2: { message: 'Error 2', type: 'required' },
      } as FieldErrors;
      
      render(<FormErrorSummary errors={errors} />);
      expect(screen.getByText('Terdapat kesalahan pada form:')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      const errors = {
        field1: { message: 'Error 1', type: 'required' },
      } as FieldErrors;
      
      render(<FormErrorSummary errors={errors} title="Please fix these errors:" />);
      expect(screen.getByText('Please fix these errors:')).toBeInTheDocument();
    });

    it('should display all error messages', () => {
      const errors = {
        field1: { message: 'First error', type: 'required' },
        field2: { message: 'Second error', type: 'required' },
        field3: { message: 'Third error', type: 'required' },
      } as FieldErrors;
      
      render(<FormErrorSummary errors={errors} />);
      expect(screen.getByText('First error')).toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
      expect(screen.getByText('Third error')).toBeInTheDocument();
    });

    it('should render errors as list items', () => {
      const errors = {
        field1: { message: 'Error 1', type: 'required' },
        field2: { message: 'Error 2', type: 'required' },
      } as FieldErrors;
      
      render(<FormErrorSummary errors={errors} />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('should apply appropriate styling classes', () => {
      const errors = {
        field1: { message: 'Error', type: 'required' },
      } as FieldErrors;
      
      const { container } = render(<FormErrorSummary errors={errors} />);
      const errorSummary = container.querySelector('.form-error-summary');
      
      expect(errorSummary).toBeInTheDocument();
      expect(errorSummary).toHaveClass('bg-red-50');
      expect(errorSummary).toHaveClass('border-red-200');
    });

    it('should filter out undefined/null errors', () => {
      const errors = {
        field1: { message: 'Valid error', type: 'required' },
        field2: undefined,
        field3: { message: undefined, type: 'required' },
      } as any;
      
      render(<FormErrorSummary errors={errors} />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(1);
      expect(screen.getByText('Valid error')).toBeInTheDocument();
    });
  });
});
