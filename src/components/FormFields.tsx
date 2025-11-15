/**
 * Form Field Components
 * 
 * Reusable form field components integrated with react-hook-form
 * Provides consistent styling and error display
 */

import { Path, UseFormRegister, FieldErrors, FieldValues } from 'react-hook-form';

// ============================================
// TYPES
// ============================================

interface BaseFieldProps<TFormValues extends FieldValues> {
  name: Path<TFormValues>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
}

interface FormFieldProps<TFormValues extends FieldValues> extends BaseFieldProps<TFormValues> {
  register: UseFormRegister<TFormValues>;
  errors: FieldErrors<TFormValues>;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
}

interface TextareaFieldProps<TFormValues extends FieldValues> extends BaseFieldProps<TFormValues> {
  register: UseFormRegister<TFormValues>;
  errors: FieldErrors<TFormValues>;
  rows?: number;
}

interface SelectFieldProps<TFormValues extends FieldValues> extends BaseFieldProps<TFormValues> {
  register: UseFormRegister<TFormValues>;
  errors: FieldErrors<TFormValues>;
  options: Array<{ value: string | number; label: string }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get error message from errors object
 */
function getErrorMessage<TFormValues extends FieldValues>(
  errors: FieldErrors<TFormValues>,
  name: Path<TFormValues>
): string | undefined {
  const error = errors[name as string];
  return error?.message as string | undefined;
}

/**
 * Check if field has error
 */
function hasError<TFormValues extends FieldValues>(
  errors: FieldErrors<TFormValues>,
  name: Path<TFormValues>
): boolean {
  return !!errors[name as string];
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Text/Email/Password/Tel/URL Input Field
 * 
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   label="Email"
 *   type="email"
 *   placeholder="email@example.com"
 *   register={register}
 *   errors={errors}
 *   required
 * />
 * ```
 */
export function FormField<TFormValues extends FieldValues>(props: FormFieldProps<TFormValues>) {
  const {
    name,
    label,
    type = 'text',
    placeholder,
    required,
    disabled,
    className = '',
    helpText,
    register,
    errors,
  } = props;
  
  const error = getErrorMessage(errors, name);
  const hasErr = hasError(errors, name);

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={name}
        type={type}
        {...register(name)}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${hasErr ? 'border-red-500' : ''}`}
        aria-invalid={hasErr}
        aria-describedby={hasErr ? `${name}-error` : undefined}
      />
      
      {helpText && !hasErr && (
        <p className="form-help-text text-sm text-gray-500 mt-1">
          {helpText}
        </p>
      )}
      
      {hasErr && (
        <p id={`${name}-error`} className="form-error text-sm text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea Field
 * 
 * @example
 * ```tsx
 * <TextareaField
 *   name="description"
 *   label="Deskripsi"
 *   rows={4}
 *   placeholder="Masukkan deskripsi..."
 *   register={register}
 *   errors={errors}
 * />
 * ```
 */
export function TextareaField<TFormValues extends FieldValues>(props: TextareaFieldProps<TFormValues>) {
  const {
    name,
    label,
    placeholder,
    required,
    disabled,
    className = '',
    helpText,
    rows = 4,
    register,
    errors,
  } = props;
  
  const error = getErrorMessage(errors, name);
  const hasErr = hasError(errors, name);

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={name}
        {...register(name)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`form-input ${hasErr ? 'border-red-500' : ''}`}
        aria-invalid={hasErr}
        aria-describedby={hasErr ? `${name}-error` : undefined}
      />
      
      {helpText && !hasErr && (
        <p className="form-help-text text-sm text-gray-500 mt-1">
          {helpText}
        </p>
      )}
      
      {hasErr && (
        <p id={`${name}-error`} className="form-error text-sm text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Select/Dropdown Field
 * 
 * @example
 * ```tsx
 * <SelectField
 *   name="status"
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   register={register}
 *   errors={errors}
 *   required
 * />
 * ```
 */
export function SelectField<TFormValues extends FieldValues>(props: SelectFieldProps<TFormValues>) {
  const {
    name,
    label,
    options,
    placeholder,
    required,
    disabled,
    className = '',
    helpText,
    register,
    errors,
  } = props;
  
  const error = getErrorMessage(errors, name);
  const hasErr = hasError(errors, name);

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={name}
        {...register(name)}
        disabled={disabled}
        className={`form-input ${hasErr ? 'border-red-500' : ''}`}
        aria-invalid={hasErr}
        aria-describedby={hasErr ? `${name}-error` : undefined}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && !hasErr && (
        <p className="form-help-text text-sm text-gray-500 mt-1">
          {helpText}
        </p>
      )}
      
      {hasErr && (
        <p id={`${name}-error`} className="form-error text-sm text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Form Error Summary
 * Shows all form errors at once
 * 
 * @example
 * ```tsx
 * <FormErrorSummary errors={errors} />
 * ```
 */
export function FormErrorSummary<TFormValues extends FieldValues>(props: {
  errors: FieldErrors<TFormValues>;
  title?: string;
}) {
  const { errors, title = 'Terdapat kesalahan pada form:' } = props;
  const errorMessages = Object.values(errors)
    .map((error) => error?.message)
    .filter(Boolean) as string[];

  if (errorMessages.length === 0) {
    return null;
  }

  return (
    <div className="form-error-summary bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <p className="font-semibold text-red-800 mb-2">{title}</p>
      <ul className="list-disc list-inside space-y-1">
        {errorMessages.map((message, index) => (
          <li key={index} className="text-sm text-red-700">
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

