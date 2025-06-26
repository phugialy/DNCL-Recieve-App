# DNCL Receive Backend

A minimal Node.js + Express backend for the Operator Web App.

## Features
- Accepts multipart/form-data at `POST /session`
- Uploads images to AWS S3
- Stores metadata + image URLs in memory (and a JSON file)
- CORS enabled

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in `/backend` with:
   ```env
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-s3-bucket-name
   PORT=4000
   ```

3. **Run the server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

## API

### POST /session
- Accepts: `multipart/form-data`
  - `name` (string)
  - `date` (string)
  - `trackingNumber` (string)
  - `image1` (file)
  - `image2` (file)
  - `detailsImages[]` (file, optional, up to 5)
  - `detailsNotes[]` (string, optional, up to 5)
- Returns: `{ success: true, session: { ... } }`

## Notes
- Images are uploaded to S3 as private.
- Metadata is stored in `backend/session_metadata.json`.
- For production, use a persistent database and secure S3 credentials. 