import { registerAs } from '@nestjs/config';

export interface AiProviderConfig {
  apiKey: string;
  model: string;
  apiVersion?: string;
  maxTokens: number;
  temperature: number;
}

export interface AiConfig {
  provider: 'openai' | 'anthropic';
  openai: AiProviderConfig;
  anthropic: AiProviderConfig;
  defaults: {
    maxTokens: number;
    temperature: number;
  };
}

const parseProvider = (value: string | undefined): 'openai' | 'anthropic' => {
  if (value === 'anthropic') return 'anthropic';
  return 'openai';
};

export default registerAs(
  'ai',
  (): AiConfig => ({
    provider: parseProvider(process.env.AI_PROVIDER),
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
      model: process.env.OPENAI_MODEL ?? 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '4096', 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE ?? '0.7'),
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
      model: process.env.ANTHROPIC_MODEL ?? 'claude-3-opus-20240229',
      apiVersion: process.env.ANTHROPIC_API_VERSION ?? '2023-06-01',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? '4096', 10),
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE ?? '0.7'),
    },
    defaults: {
      maxTokens: parseInt(process.env.AI_MAX_TOKENS ?? '4096', 10),
      temperature: parseFloat(process.env.AI_TEMPERATURE ?? '0.7'),
    },
  }),
);
