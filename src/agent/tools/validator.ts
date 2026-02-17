/**
 * Tool Input Validator
 *
 * Runtime validation of tool inputs against their schemas.
 * Defense-in-depth validation beyond what Anthropic enforces.
 */

import { TOOLS } from "./definitions.js";

type JsonSchemaProperty = {
    type: string;
    description?: string;
    enum?: string[];
    items?: { type: string };
};

type JsonSchema = {
    type: string;
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
};

/**
 * Validate tool input against its schema.
 * Throws if validation fails.
 */
export function validateToolInput(toolName: string, input: unknown): Record<string, unknown> {
    const tool = TOOLS.find((t) => t.name === toolName);
    if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
    }

    if (input === null || typeof input !== "object") {
        throw new Error(`Tool ${toolName}: input must be an object`);
    }

    const inputObj = input as Record<string, unknown>;
    const schema = tool.input_schema as JsonSchema;

    // Check required fields
    if (schema.required) {
        for (const field of schema.required) {
            if (!(field in inputObj) || inputObj[field] === undefined) {
                throw new Error(`Tool ${toolName}: missing required field '${field}'`);
            }
        }
    }

    // Validate field types
    if (schema.properties) {
        for (const [key, value] of Object.entries(inputObj)) {
            const propSchema = schema.properties[key];
            if (!propSchema) continue; // Allow extra fields

            const expectedType = propSchema.type;
            const actualType = Array.isArray(value) ? "array" : typeof value;

            if (expectedType !== actualType) {
                throw new Error(
                    `Tool ${toolName}: field '${key}' expected ${expectedType}, got ${actualType}`,
                );
            }

            // Validate enum values
            if (propSchema.enum && !propSchema.enum.includes(value as string)) {
                throw new Error(
                    `Tool ${toolName}: field '${key}' must be one of: ${propSchema.enum.join(", ")}`,
                );
            }
        }
    }

    return inputObj;
}
