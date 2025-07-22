import { z } from 'zod';

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Validate data against a Zod schema
 * Returns a discriminated union for easy error handling
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Get formatted error messages from Zod validation error
 */
export function getValidationErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  });
  
  return fieldErrors;
}

/**
 * Get first error message from Zod validation error
 */
export function getFirstErrorMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) return 'Validation failed';
  
  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join('.')}: ` : '';
  return `${path}${firstIssue.message}`;
}

/**
 * Create a validation hook for a specific schema
 */
export function createValidationHook<T>(schema: z.ZodType<T>) {
  return (data: unknown): ValidationResult<T> => {
    return validateData(schema, data);
  };
}