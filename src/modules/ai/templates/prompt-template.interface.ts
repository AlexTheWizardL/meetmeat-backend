/**
 * Prompt Template Interface
 *
 * Defines the contract for reusable AI prompt templates.
 * Templates can be customized via variables and support different output formats.
 */

export type PromptVariables = Record<
  string,
  string | number | boolean | object | undefined
>;

export interface PromptTemplate<TInput extends PromptVariables, TOutput> {
  /**
   * Unique identifier for the template
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Description of what this prompt does
   */
  readonly description: string;

  /**
   * Build the prompt string from input variables
   */
  build(input: TInput): string;

  /**
   * Parse the AI response into the expected output type
   */
  parse(response: string): TOutput;

  /**
   * Optional: Get the expected JSON schema for the output
   */
  getOutputSchema?(): object;
}

/**
 * Base class for JSON-based prompt templates
 */
export abstract class JsonPromptTemplate<
  TInput extends PromptVariables,
  TOutput,
> implements PromptTemplate<TInput, TOutput> {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract build(input: TInput): string;

  parse(response: string): TOutput {
    // Strip markdown code blocks if present
    const jsonStr = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      return JSON.parse(jsonStr) as TOutput;
    } catch {
      throw new Error(
        `Failed to parse AI response as JSON: ${response.slice(0, 100)}...`,
      );
    }
  }

  /**
   * Helper to build consistent JSON output instructions
   */
  protected buildJsonInstructions(schemaExample: string): string {
    return `
Return ONLY valid JSON (no markdown code blocks, no explanations).
Expected format:
${schemaExample}
    `.trim();
  }
}
