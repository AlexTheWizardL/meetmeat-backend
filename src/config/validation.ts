import * as Joi from 'joi';

const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),

  // AI Provider (swappable)
  AI_PROVIDER: Joi.string().valid('openai', 'anthropic').default('openai'),
  OPENAI_API_KEY: Joi.string().when('AI_PROVIDER', {
    is: 'openai',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  OPENAI_MODEL: Joi.string().default('gpt-4-turbo-preview'),
  ANTHROPIC_API_KEY: Joi.string().when('AI_PROVIDER', {
    is: 'anthropic',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  ANTHROPIC_MODEL: Joi.string().default('claude-3-opus-20240229'),

  // Storage Provider (swappable)
  STORAGE_PROVIDER: Joi.string().valid('local', 's3', 'gcs').default('local'),
  LOCAL_STORAGE_PATH: Joi.string().default('./uploads'),
  AWS_ACCESS_KEY_ID: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_S3_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_REGION: Joi.string().default('us-east-1'),
  GCS_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 'gcs',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GCS_PROJECT_ID: Joi.string().when('STORAGE_PROVIDER', {
    is: 'gcs',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
});

export default validationSchema;
