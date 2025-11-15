/**
 * FormControls Component Tests
 * 
 * Tests for Input, Select, and Textarea components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Select, Textarea } from './FormControls';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input placeholder="Enter text" />);
      
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should accept and render value', () => {
      render(<Input value="Test value" readOnly />);
      
      const input = screen.getByDisplayValue('Test value') as HTMLInputElement;
      expect(input.value).toBe('Test value');
    });

    it('should apply custom className', () => {
      render(<Input className="custom-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-input');
    });

    it('should have default styling classes', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('rounded-md');
      expect(input.className).toContain('border');
      expect(input.className).toContain('bg-white');
    });
  });

  describe('Types', () => {
    it('should support text type', () => {
      render(<Input type="text" />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    it('should support email type', () => {
      render(<Input type="email" />);
      
      const input = document.querySelector('input[type="email"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('email');
    });

    it('should support password type', () => {
      render(<Input type="password" />);
      
      const input = document.querySelector('input[type="password"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('password');
    });

    it('should support number type', () => {
      render(<Input type="number" />);
      
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.type).toBe('number');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input.className).toContain('disabled:opacity-50');
    });

    it('should be readonly when readOnly prop is true', () => {
      render(<Input readOnly value="Read only" />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toHaveAttribute('readonly');
    });

    it('should show placeholder text', () => {
      render(<Input placeholder="Type something..." />);
      
      expect(screen.getByPlaceholderText('Type something...')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value when typing', async () => {
      const user = userEvent.setup();
      
      render(<Input placeholder="Type here" />);
      
      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
      await user.type(input, 'Test input');
      
      expect(input.value).toBe('Test input');
    });

    it('should not change value when disabled', async () => {
      const user = userEvent.setup();
      
      render(<Input disabled value="Cannot change" readOnly />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Try to type');
      
      expect(input.value).toBe('Cannot change');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Username input" />);
      
      expect(screen.getByLabelText('Username input')).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="help-text" />
          <span id="help-text">Enter your username</span>
        </>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('should be focusable', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(input).toHaveFocus();
    });
  });
});

describe('Select', () => {
  describe('Rendering', () => {
    it('should render select element with options', () => {
      render(
        <Select>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should accept and render default value', () => {
      render(
        <Select defaultValue="2">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('2');
    });

    it('should apply custom className', () => {
      render(
        <Select className="custom-select">
          <option>Option</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('custom-select');
    });

    it('should have default styling classes', () => {
      render(
        <Select>
          <option>Option</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('rounded-md');
      expect(select.className).toContain('border');
      expect(select.className).toContain('bg-white');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(
        <Select disabled>
          <option>Option</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      expect(select.className).toContain('disabled:opacity-50');
    });

    it('should support multiple selection', () => {
      render(
        <Select multiple>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      
      const select = screen.getByRole('listbox') as HTMLSelectElement;
      expect(select).toHaveAttribute('multiple');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when selection changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Select onChange={handleChange}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update selected value when option is chosen', async () => {
      const user = userEvent.setup();
      
      render(
        <Select>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, '3');
      
      expect(select.value).toBe('3');
    });

    it('should not change value when disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <Select disabled defaultValue="1">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, '2');
      
      expect(select.value).toBe('1');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(
        <Select aria-label="Country selector">
          <option>USA</option>
        </Select>
      );
      
      expect(screen.getByLabelText('Country selector')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <Select>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      expect(select).toHaveFocus();
    });
  });
});

describe('Textarea', () => {
  describe('Rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea placeholder="Enter description" />);
      
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    });

    it('should accept and render value', () => {
      render(<Textarea value="Multi-line text" readOnly />);
      
      const textarea = screen.getByDisplayValue('Multi-line text') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Multi-line text');
    });

    it('should apply custom className', () => {
      render(<Textarea className="custom-textarea" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('custom-textarea');
    });

    it('should have default styling classes', () => {
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('rounded-md');
      expect(textarea.className).toContain('border');
      expect(textarea.className).toContain('min-h-[80px]');
    });
  });

  describe('Size', () => {
    it('should have minimum height', () => {
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('min-h-[80px]');
    });

    it('should support rows attribute', () => {
      render(<Textarea rows={5} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('rows', '5');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
      expect(textarea.className).toContain('disabled:opacity-50');
    });

    it('should be readonly when readOnly prop is true', () => {
      render(<Textarea readOnly value="Read only text" />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('readonly');
    });

    it('should show placeholder text', () => {
      render(<Textarea placeholder="Type your message..." />);
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Textarea onChange={handleChange} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello World');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value when typing', async () => {
      const user = userEvent.setup();
      
      render(<Textarea placeholder="Type here" />);
      
      const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement;
      await user.type(textarea, 'Line 1\nLine 2');
      
      expect(textarea.value).toBe('Line 1\nLine 2');
    });

    it('should handle multi-line text', async () => {
      const user = userEvent.setup();
      
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(textarea, 'First line{Enter}Second line{Enter}Third line');
      
      expect(textarea.value).toContain('\n');
    });

    it('should not change value when disabled', async () => {
      const user = userEvent.setup();
      
      render(<Textarea disabled value="Cannot change" readOnly />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(textarea, 'Try to type');
      
      expect(textarea.value).toBe('Cannot change');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Textarea aria-label="Description field" />);
      
      expect(screen.getByLabelText('Description field')).toBeInTheDocument();
    });

    it('should support maxLength', () => {
      render(<Textarea maxLength={100} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(100);
    });

    it('should be focusable', () => {
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      
      expect(textarea).toHaveFocus();
    });
  });
});

