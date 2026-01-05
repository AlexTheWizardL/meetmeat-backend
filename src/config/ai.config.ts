import { registerAs } from '@nestjs/config';

export interface AiConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
}

export default registerAs(
  'ai',
  (): AiConfig => ({
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
      model: process.env.OPENAI_MODEL ?? 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '4096', 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE ?? '0.7'),
    },
  }),
);
