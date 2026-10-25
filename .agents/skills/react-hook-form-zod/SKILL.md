---
name: react-hook-form-zod
description: Performant, type-safe form management using React Hook Form, Zod schema validation, and dynamic field arrays.
---

# React Hook Form & Zod Schema Validation

## Overview
Isolates component re-renders during text input, providing strict TypeScript type inference and client-side validation.

## Implementation Pattern
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const FormSchema = z.object({
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
});

type FormValues = z.infer<typeof FormSchema>;

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: FormValues) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```
