import { z } from 'zod';

// Common Validation Schemas for Monely Finance

// User & Auth
export const emailSchema = z.string().email('Email inválido').min(5, 'Email muito curto');
export const passwordSchema = z.string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Financial
export const amountSchema = z.number({ invalid_type_error: 'O valor deve ser um número' })
  .positive('O valor deve ser maior que zero')
  .max(1000000000, 'Valor muito alto');

export const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  amount: amountSchema,
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data inválida",
  }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['expense', 'income', 'transfer']),
});

// Helper function for safe parsing
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    // Return the first error message
    const firstError = result.error.errors[0];
    return { success: false, error: firstError.message };
  }
};
