import { z } from 'zod';
import { insertGroupSchema, insertExpenseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups' as const,
      responses: { 
        200: z.any() 
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups' as const,
      input: insertGroupSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    get: {
      method: 'GET' as const,
      path: '/api/groups/:id' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound }, 
    },
    join: {
      method: 'POST' as const,
      path: '/api/groups/:id/join' as const,
      responses: { 200: z.any(), 400: errorSchemas.validation, 404: errorSchemas.notFound },
    },
  },
  expenses: {
    create: {
      method: 'POST' as const,
      path: '/api/groups/:groupId/expenses' as const,
      input: insertExpenseSchema.omit({ groupId: true }).extend({
        splits: z.array(z.object({
          userId: z.string(),
          amountOwed: z.number()
        }))
      }),
      responses: { 201: z.any(), 400: errorSchemas.validation },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
