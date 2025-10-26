-- Migration: Add image_url column to submissions table
-- This stores the Netlify Blobs URL for uploaded essay images

ALTER TABLE grader.submissions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Note: This column stores the blob URL for images uploaded from handwritten essays
-- Format: /.netlify/blobs/essay-images/{submission_id}.jpg
