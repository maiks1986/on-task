import { ZodSchema } from 'zod';

// Tool factory to create consistent tool definitions
export function createTool(
  name: string, 
  schema: Record<string, ZodSchema> | ZodSchema, 
  handler: (params: any, extra?: any) => Promise<any>
) {
  // Convert schema to proper JSON Schema format for MCP protocol
  const formattedSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  } = {
    type: 'object',
    properties: {},
    required: []
  };
  
  // If schema is a record of ZodSchemas, format each property
  if (typeof schema === 'object' && !('_def' in schema)) {
    Object.entries(schema as Record<string, ZodSchema>).forEach(([key, zodSchema]) => {
      // Add to properties
      formattedSchema.properties[key] = {
        type: getSchemaType(zodSchema),
        description: `Parameter ${key} for tool ${name}`
      };
      
      // Check if required
      if (!zodSchema.isOptional?.()) {
        formattedSchema.required.push(key);
      }
    });
  }
  
  return {
    name,
    schema: formattedSchema,
    handler
  };
}

// Helper function to determine schema type
function getSchemaType(schema: ZodSchema): string {
  // Access the schema description safely
  const description = schema.description ? schema.description : '';
  
  if (description.includes('string')) return 'string';
  if (description.includes('number')) return 'number';
  if (description.includes('boolean')) return 'boolean';
  if (description.includes('array')) return 'array';
  if (description.includes('object')) return 'object';
  
  // Try to infer from the schema type if possible
  const schemaType = (schema as any)._def?.typeName;
  if (schemaType === 'ZodString') return 'string';
  if (schemaType === 'ZodNumber') return 'number';
  if (schemaType === 'ZodBoolean') return 'boolean';
  if (schemaType === 'ZodArray') return 'array';
  if (schemaType === 'ZodObject') return 'object';
  
  // Default to string if type can't be determined
  return 'string';
}
