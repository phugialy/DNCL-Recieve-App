import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// AWS SDK v3 imports
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// CORS
app.use(cors());

// Multer setup for multipart/form-data
const upload = multer({ dest: 'uploads/' });

// AWS S3 v3 setup
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

let s3Client = null;
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION) {
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
} else {
  console.warn('AWS credentials not set. S3 upload will be skipped.');
}

// In-memory metadata storage (or use a JSON file)
const METADATA_FILE = path.join(process.cwd(), 'backend', 'session_metadata.json');
let sessionMetadata = [];
if (fs.existsSync(METADATA_FILE)) {
  try {
    sessionMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  } catch (e) {
    sessionMetadata = [];
  }
}
function saveMetadata() {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(sessionMetadata, null, 2));
}

// Helper to upload a file to S3 (v3)
async function uploadToS3V3(file, keyPrefix = '') {
  if (!s3Client || !S3_BUCKET) {
    return null;
  }
  const fileContent = fs.readFileSync(file.path);
  const s3Key = `${keyPrefix}${Date.now()}_${file.originalname}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: 'public-read', // For public URL
  }));
  fs.unlinkSync(file.path); // Remove local temp file
  return s3Key;
}

function getS3PublicUrl(bucket, key, region) {
  // Standard S3 public URL format
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// POST /session endpoint
app.post('/session', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'detailsImages[]', maxCount: 5 },
]), async (req, res) => {
  try {
    const { name, date, trackingNumber } = req.body;
    const image1 = req.files['image1']?.[0];
    const image2 = req.files['image2']?.[0];
    const detailsImages = req.files['detailsImages[]'] || [];
    const detailsNotes = Array.isArray(req.body['detailsNotes[]']) ? req.body['detailsNotes[]'] : req.body['detailsNotes[]'] ? [req.body['detailsNotes[]']] : [];

    if (!name || !date || !trackingNumber || !image1 || !image2) {
      return res.status(400).json({ error: 'Missing required fields or images.' });
    }

    // Upload images to S3 if possible
    let image1Url = 'S3_NOT_CONFIGURED';
    let image2Url = 'S3_NOT_CONFIGURED';
    let detailsImageUrls = [];
    if (s3Client && S3_BUCKET && AWS_REGION) {
      const image1Key = await uploadToS3V3(image1, 'uploads/');
      const image2Key = await uploadToS3V3(image2, 'uploads/');
      image1Url = getS3PublicUrl(S3_BUCKET, image1Key, AWS_REGION);
      image2Url = getS3PublicUrl(S3_BUCKET, image2Key, AWS_REGION);
      for (const file of detailsImages) {
        const key = await uploadToS3V3(file, 'uploads/details/');
        detailsImageUrls.push(getS3PublicUrl(S3_BUCKET, key, AWS_REGION));
      }
    } else {
      // Remove temp files if not uploading
      fs.unlinkSync(image1.path);
      fs.unlinkSync(image2.path);
      for (const file of detailsImages) {
        fs.unlinkSync(file.path);
      }
    }

    // Build metadata
    const session = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      date,
      trackingNumber,
      image1Url,
      image2Url,
      details: detailsImageUrls.map((url, i) => ({
        imageUrl: url,
        note: detailsNotes[i] || '',
      })),
      createdAt: new Date().toISOString(),
    };
    sessionMetadata.push(session);
    saveMetadata();

    res.json({ success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
}); 