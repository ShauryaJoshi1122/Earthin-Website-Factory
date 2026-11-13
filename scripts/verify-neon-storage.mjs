import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

async function main() {
  console.log('--- Testing Neon Object Storage ---');
  console.log('Endpoint:', process.env.AWS_ENDPOINT_URL_S3);
  console.log('Region:', process.env.AWS_REGION);

  try {
    const buckets = await s3.send(new ListBucketsCommand({}));
    console.log('Available buckets:', buckets.Buckets?.map(b => b.Name));

    const testKey = `test-${Date.now()}.txt`;
    const message = 'Hello from Earthin Website Factory on Neon Object Storage!';
    
    console.log(`Writing test object "${testKey}" to bucket "assets"...`);
    const putRes = await s3.send(new PutObjectCommand({
      Bucket: 'assets',
      Key: testKey,
      Body: message,
      ContentType: 'text/plain',
    }));
    console.log('PutObject HTTP status:', putRes.$metadata.httpStatusCode);

    console.log(`Reading back "${testKey}"...`);
    const getRes = await s3.send(new GetObjectCommand({
      Bucket: 'assets',
      Key: testKey,
    }));
    const content = await getRes.Body.transformToString();
    console.log('Content verified:', content === message ? 'MATCH (PASS)' : 'MISMATCH');

    console.log('Neon Object Storage test: SUCCESS');
  } catch (err) {
    console.error('Neon Object Storage test failed:', err);
    process.exit(1);
  }
}

main();
