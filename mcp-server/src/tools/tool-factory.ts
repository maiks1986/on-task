import { ZodSchema } from 'zod';

// Tool factory to create consistent tool definitions
export function createTool(
  name: string, 
  schema: Record<string, ZodSchema> | ZodSchema, 
  handler: (params: any, extra?: any) => Promise<any>
) {
  return {
    name,
    schema,
    handler
  };
}
