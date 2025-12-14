import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  provider: 'local' | 's3' | 'gcs';
  local: {
    path: string;
  };
  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
  };
  gcs: {
    projectId: string;
    bucket: string;
  };
}

const parseProvider = (value: string | undefined): 'local' | 's3' | 'gcs' => {
  if (value === 's3') return 's3';
  if (value === 'gcs') return 'gcs';
  return 'local';
};

export default registerAs(
  'storage',
  (): StorageConfig => ({
    provider: parseProvider(process.env.STORAGE_PROVIDER),
    local: {
      path: process.env.LOCAL_STORAGE_PATH ?? './uploads',
    },
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      bucket: process.env.AWS_S3_BUCKET ?? '',
      region: process.env.AWS_REGION ?? 'us-east-1',
    },
    gcs: {
      projectId: process.env.GCS_PROJECT_ID ?? '',
      bucket: process.env.GCS_BUCKET ?? '',
    },
  }),
);
