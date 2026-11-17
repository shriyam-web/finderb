import 'server-only';

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Env } from '@/lib/media/env';

let client: S3Client | null = null;

export function mediaStorage() {
  const env = s3Env();
  if (!env.ready) return null;
  if (!client) {
    client = new S3Client({
      region: env.region,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
    });
  }
  return { client, env };
}

export async function presignPut(bucket: string, key: string, contentType: string, expiresIn = 600) {
  const store = mediaStorage();
  if (!store) return null;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(store.client, command, { expiresIn });
  return { uploadUrl, contentType };
}

function privateObjectKey(key: string) {
  return (key.startsWith('private/cvs/') || key.startsWith('private/verification/')) && !key.includes('..');
}

export async function presignPrivateGet(key: string) {
  const store = mediaStorage();
  if (!store || !privateObjectKey(key)) return null;
  const command = new GetObjectCommand({ Bucket: store.env.privateBucket, Key: key });
  return getSignedUrl(store.client, command, { expiresIn: 600 });
}

export async function deletePrivateObject(key: string) {
  const store = mediaStorage();
  if (!store || !privateObjectKey(key)) return;
  await store.client.send(new DeleteObjectCommand({ Bucket: store.env.privateBucket, Key: key })).catch(() => undefined);
}

export async function putPrivateBytes(key: string, body: Buffer, contentType: string) {
  const store = mediaStorage();
  if (!store || !privateObjectKey(key)) return false;
  await store.client.send(new PutObjectCommand({
    Bucket: store.env.privateBucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  }));
  return true;
}

export async function readPublicObject(key: string) {
  const store = mediaStorage();
  if (!store || !key.startsWith('public/promotions/') || key.includes('..')) return null;
  const head = await store.client.send(new HeadObjectCommand({ Bucket: store.env.publicBucket, Key: key }));
  const loaded = await store.client.send(new GetObjectCommand({ Bucket: store.env.publicBucket, Key: key }));
  if (!loaded.Body) return null;
  const bytes = Buffer.from(await loaded.Body.transformToByteArray());
  return { bytes, contentLength: Number(head.ContentLength || bytes.length) };
}

export async function deletePublicPromotion(key: string) {
  const store = mediaStorage();
  if (!store || !key.startsWith('public/promotions/') || key.includes('..')) return;
  await store.client.send(new DeleteObjectCommand({ Bucket: store.env.publicBucket, Key: key })).catch(() => undefined);
}
