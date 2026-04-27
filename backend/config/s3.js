const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Upload a file buffer to S3.
 * @param {Buffer} fileBuffer - File content
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type
 * @param {string} folder - S3 folder prefix (e.g., 'documents', 'avatars')
 * @returns {Promise<{key: string, url: string}>}
 */
const uploadFile = async (fileBuffer, originalName, mimeType, folder = 'uploads') => {
  const ext = path.extname(originalName);
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
};

/**
 * Delete a file from S3.
 * @param {string} key - S3 object key
 */
const deleteFile = async (key) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

/**
 * Generate a pre-signed URL for temporary secure access.
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Seconds until URL expires (default 1 hour)
 * @returns {Promise<string>}
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

module.exports = { uploadFile, deleteFile, getPresignedUrl };
