import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { withRetry } from '../../../common/utils/retry';
import {
  AiServiceUnavailableException,
  AiConfigurationException,
  AiRateLimitException,
} from '../../../common/exceptions/app.exceptions';

export interface OpenAiResponse {
  choices: { message: { content: string } }[];
}

export interface DalleResponse {
  data: { url?: string; b64_json?: string; revised_prompt?: string }[];
}

export interface OpenAiMessage {
  role: 'user' | 'system' | 'assistant';
  content: string | OpenAiContentPart[];
}

export interface OpenAiContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

@Injectable()
export class OpenAiClient {
  private readonly logger = new Logger(OpenAiClient.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly visionModel: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.openai.apiKey') ?? '';
    this.model =
      this.configService.get<string>('ai.openai.model') ?? 'gpt-4-turbo';
    this.visionModel = 'gpt-4o';
  }

  get isConfigured(): boolean {
    return this.apiKey !== '';
  }

  async callText(
    prompt: string,
    responseFormat: 'json_object' | 'text' = 'text',
  ): Promise<string> {
    return withRetry(
      async () => {
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: this.model,
              messages: [{ role: 'user', content: prompt }],
              response_format:
                responseFormat === 'json_object'
                  ? { type: 'json_object' }
                  : undefined,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `OpenAI API error: ${String(response.status)} - ${errorText}`,
          );
          this.handleApiError(response.status, errorText);
        }

        const data = (await response.json()) as OpenAiResponse;
        return data.choices[0].message.content;
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        logger: this.logger,
        context: 'OpenAI API',
      },
    );
  }

  async callVision(prompt: string, imageBase64: string): Promise<string> {
    return withRetry(
      async () => {
        const messages: OpenAiMessage[] = [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                  detail: 'low',
                },
              },
            ],
          },
        ];

        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: this.visionModel,
              messages,
              max_tokens: 2000,
              response_format: { type: 'json_object' },
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `OpenAI Vision API error: ${String(response.status)} - ${errorText}`,
          );
          this.handleApiError(response.status, errorText);
        }

        const data = (await response.json()) as OpenAiResponse;
        return data.choices[0].message.content;
      },
      {
        maxRetries: 2,
        initialDelayMs: 1000,
        logger: this.logger,
        context: 'OpenAI Vision API',
      },
    );
  }

  async callDalle(prompt: string): Promise<string> {
    return withRetry(
      async () => {
        const response = await fetch(
          'https://api.openai.com/v1/images/generations',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt,
              n: 1,
              size: '1024x1792',
              quality: 'standard',
              response_format: 'b64_json',
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `DALL-E API error: ${String(response.status)} - ${errorText}`,
          );
          this.handleApiError(response.status, errorText);
        }

        const data = (await response.json()) as DalleResponse;
        this.logger.log(`DALL-E generated image successfully`);

        const b64 = data.data[0].b64_json ?? '';
        return `data:image/png;base64,${b64}`;
      },
      {
        maxRetries: 2,
        initialDelayMs: 2000,
        logger: this.logger,
        context: 'DALL-E API',
      },
    );
  }

  private handleApiError(status: number, errorText: string): never {
    if (status === 401) {
      throw new AiConfigurationException();
    }
    if (status === 429) {
      throw new AiRateLimitException();
    }
    throw new AiServiceUnavailableException(errorText);
  }
}
