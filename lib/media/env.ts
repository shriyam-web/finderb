export type S3Env = {
  ready: boolean;
  region: string;
  publicBucket: string;
  privateBucket: string;
  cdnHost: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function cleanHost(value: string) {
  return value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
}

/** Present only when every required storage setting exists. Values are never logged. */
export function s3Env(): S3Env {
  const region = process.env.AWS_REGION?.trim() || '';
  const publicBucket = process.env.FINDERB_S3_PUBLIC_BUCKET?.trim() || '';
  const privateBucket = process.env.FINDERB_S3_PRIVATE_BUCKET?.trim() || '';
  const cdnHost = cleanHost(process.env.FINDERB_MEDIA_CDN_HOST || '');
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || '';
  const distinctBuckets = publicBucket !== privateBucket;
  const ready = Boolean(
    region && publicBucket && privateBucket && distinctBuckets && cdnHost && accessKeyId && secretAccessKey,
  );
  return { ready, region, publicBucket, privateBucket, cdnHost, accessKeyId, secretAccessKey };
}
