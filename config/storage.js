"use strict";
const { S3Client, PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { env } = require('./env');
const s3 = new S3Client({ region: env.awsRegion });
function bucketAdapter(bucket) {
  const logicalBuckets = new Set(['cvs', 'lettres-motivation', 'recommandations', 'photos', 'notes-bulletins', env.s3Bucket]);
  if (!logicalBuckets.has(bucket)) { const error = new Error('Type de stockage non autorisé'); error.status = 422; throw error; }
  const prefix = bucket === env.s3Bucket ? '' : `${bucket}/`;
  return {
    async createSignedUploadUrl(key) {
      const signedUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: env.s3Bucket, Key: `${prefix}${key}` }), { expiresIn: 900 });
      return { data: { signedUrl, path: key }, error: null };
    },
    getPublicUrl(key) {
      const base = env.cloudFrontBaseUrl.replace(/\/$/, '');
      return { data: { publicUrl: `${base}/${prefix}${String(key).split('/').map(encodeURIComponent).join('/')}` } };
    },
    async remove(keys) {
      if (!keys?.length) return { data: [], error: null };
      const result = await s3.send(new DeleteObjectsCommand({ Bucket: env.s3Bucket, Delete: { Objects: keys.map((Key) => ({ Key: `${prefix}${Key}` })), Quiet: true } }));
      return { data: result.Deleted ?? [], error: null };
    },
  };
}
module.exports = { storage: { from: bucketAdapter } };
