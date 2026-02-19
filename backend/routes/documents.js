const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure AWS S3 (will use environment variables)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'dllc-hr-documents';

// Upload document
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { employee_id } = req.user;
    const { category } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // For MVP, store files locally if S3 is not configured
    const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    let file_url;

    if (useS3) {
      // Upload to S3
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const params = {
        Bucket: S3_BUCKET,
        Key: `documents/${employee_id}/${fileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };

      const uploadResult = await s3.upload(params).promise();
      file_url = uploadResult.Location;
    } else {
      // Store base64 encoded file in database for MVP
      file_url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Save document metadata
    const result = await pool.query(
      'INSERT INTO documents (employee_id, file_url, file_name, file_type, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employee_id, file_url, req.file.originalname, req.file.mimetype, category || 'Other']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get documents
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, employee_id } = req.user;
    const { employee_id: queryEmployeeId, category } = req.query;

    let query = `
      SELECT d.*, e.full_name, e.employee_id as emp_code
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Employee can only see their own documents
    if (role === 'Employee') {
      params.push(employee_id);
      query += ` AND d.employee_id = $${params.length}`;
    } else if (queryEmployeeId) {
      params.push(queryEmployeeId);
      query += ` AND d.employee_id = $${params.length}`;
    }

    // Filter by category
    if (category) {
      params.push(category);
      query += ` AND d.category = $${params.length}`;
    }

    query += ' ORDER BY d.uploaded_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Delete document
router.delete('/:id', authenticate, authorize('Admin', 'Director', 'HR'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get document to delete from S3 if needed
    const doc = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    
    if (doc.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from S3 if using S3
    if (process.env.AWS_ACCESS_KEY_ID && !doc.rows[0].file_url.startsWith('data:')) {
      const key = doc.rows[0].file_url.split('.com/')[1];
      if (key) {
        await s3.deleteObject({ Bucket: S3_BUCKET, Key: key }).promise();
      }
    }

    // Delete from database
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;