/**
 * useValidatedForm Hook
 * 
 * Integrates react-hook-form with Zod validation schemas
 * Provides standardized form handling with type safety
 */

import { useForm, UseFormProps, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodSchema } from 'zod';

/**
 * Configuration options for useValidatedForm
 */
export interface UseValidatedFormOptions<TFormValues extends FieldValues> 
  extends Omit<UseFormProps<TFormValues>, 'resolver'> {
  /**
   * Zod schema for validation
   */
  schema: ZodSchema<TFormValues>;
  
  /**
   * Callback when form is successfully submitted
   */
  onSubmit: (data: TFormValues) => void | Promise<void>;
  
  /**
   * Callback when form submission fails validation
   */
  onError?: (errors: Record<string, any>) => void;
  
  /**
   * Whether to reset form after successful submission
   * @default true
   */
  resetOnSuccess?: boolean;
  
  /**
   * Custom success message
   */
  successMessage?: string;
  
  /**
   * Custom error message
   */
  errorMessage?: string;
}

/**
 * Return type for useValidatedForm hook
 */
export interface UseValidatedFormReturn<TFormValues extends FieldValues> 
  extends Omit<UseFormReturn<TFormValues>, 'handleSubmit'> {
  /**
   * Handle form submission with validation
   */
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  
  /**
   * Whether form is currently submitting
   */
  isSubmitting: boolean;
  
  /**
   * Whether form is valid (no errors)
   */
  isValid: boolean;
  
  /**
   * Whether form has been touched/modified
   */
  isDirty: boolean;
  
  /**
   * Get error message for a field
   */
  getError: (fieldName: Path<TFormValues>) => string | undefined;
  
  /**
   * Check if field has error
   */
  hasError: (fieldName: Path<TFormValues>) => boolean;
  
  /**
   * Reset form to initial values
   */
  resetForm: () => void;
  
  /**
   * Set form values programmatically
   */
  setFormValues: (values: Partial<TFormValues>) => void;
}

/**
 * Hook for form validation using Zod + react-hook-form
 * 
 * @example
 * ```tsx
 * const loginSchema = z.object({
 *   email: emailSchema,
 *   password: passwordSchema,
 * });
 * 
 * type LoginForm = z.infer<typeof loginSchema>;
 * 
 * function LoginForm() {
 *   const {
 *     register,
 *     handleSubmit,
 *     getError,
 *     hasError,
 *     isSubmitting,
 *   } = useValidatedForm<LoginForm>({
 *     schema: loginSchema,
 *     onSubmit: async (data) => {
 *       await loginUser(data);
 *     },
 *   });
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input {...register('email')} />
 *       {hasError('email') && <span>{getError('email')}</span>}
 *       
 *       <input {...register('password')} type="password" />
 *       {hasError('password') && <span>{getError('password')}</span>}
 *       
 *       <button type="submit" disabled={isSubmitting}>
 *         Login
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useValidatedForm<TFormValues extends FieldValues>({
  schema,
  onSubmit,
  onError,
  resetOnSuccess = true,
  successMessage,
  errorMessage,
  ...formOptions
}: UseValidatedFormOptions<TFormValues>): UseValidatedFormReturn<TFormValues> {
  // Initialize react-hook-form with Zod resolver
  // @ts-ignore - Complex generic type inference issue with zodResolver
  const form = useForm<TFormValues>({
    // @ts-ignore
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur by default
    ...formOptions,
  });

  const {
    handleSubmit: rhfHandleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
    setValue,
  } = form;

  /**
   * Get error message for a specific field
   */
  const getError = (fieldName: Path<TFormValues>): string | undefined => {
    const error = errors[fieldName];
    return error?.message as string | undefined;
  };

  /**
   * Check if a field has an error
   */
  const hasError = (fieldName: Path<TFormValues>): boolean => {
    return !!errors[fieldName];
  };

  /**
   * Reset form to initial values
   */
  const resetForm = () => {
    reset();
  };

  /**
   * Set multiple form values at once
   */
  const setFormValues = (values: Partial<TFormValues>) => {
    Object.entries(values).forEach(([key, value]) => {
      setValue(key as Path<TFormValues>, value as any);
    });
  };

  /**
   * Handle form submission with error handling
   */
  const handleSubmit = rhfHandleSubmit(
    async (data) => {
      try {
        // @ts-ignore - Generic type constraint issue
        await onSubmit(data);
        
        if (resetOnSuccess) {
          reset();
        }
      } catch (error) {
        console.error('Form submission error:', error);
      }
    },
    (errors) => {
      // Call onError callback if provided
      if (onError) {
        onError(errors);
      }
    }
  );

  // @ts-ignore - Complex generic type inference with react-hook-form
  return {
    ...form,
    handleSubmit: handleSubmit as any,
    isSubmitting,
    isValid,
    isDirty,
    getError,
    hasError,
    resetForm,
    setFormValues,
  };
}

/**
 * Helper to infer TypeScript type from Zod schema
 * 
 * @example
 * ```tsx
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 * 
 * type LoginFormData = InferFormType<typeof loginSchema>;
 * // { email: string; password: string; }
 * ```
 */
export type InferFormType<T extends ZodSchema> = z.infer<T>;
