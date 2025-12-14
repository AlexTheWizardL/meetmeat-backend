import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { AiService } from './ai.service';

/**
 * AI Module with swappable providers
 *
 * The provider is selected based on AI_PROVIDER env variable.
 * Add new providers by:
 * 1. Creating a new provider class implementing AiProviderInterface
 * 2. Adding it to the factory switch statement below
 */
@Global()
@Module({})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AiModule {
  static forRoot(): DynamicModule {
    return {
      module: AiModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: AI_PROVIDER,
          useFactory: (configService: ConfigService) => {
            const provider = configService.get<string>('ai.provider');

            switch (provider) {
              case 'anthropic':
                return new AnthropicProvider(configService);
              case 'openai':
              default:
                return new OpenAiProvider(configService);
            }
          },
          inject: [ConfigService],
        },
        AiService,
      ],
      exports: [AI_PROVIDER, AiService],
    };
  }
}
