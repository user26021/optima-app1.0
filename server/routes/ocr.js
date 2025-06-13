const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const { db } = require('../config/database');
const { rateLimiter } = require('../middleware/rateLimiter');

// Rate limiting for OCR (more restrictive)
const ocrRateLimit = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 OCR requests per 5 minutes
  message: 'Too many OCR requests'
});

// Upload and process receipt
router.post('/upload-receipt', authMiddleware, ocrRateLimit, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const sessionId = req.body.sessionId || null;
    const file = req.file;

    console.log(`📷 Processing receipt upload for user ${userId}`);

    // Validate image file
    const validation = await ocrService.validateImageFile(file.path);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Store file record in database
    const fileRecord = await db.run(
      'INSERT INTO uploaded_files (user_id, session_id, filename, original_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, sessionId, file.filename, file.originalname, file.path, file.mimetype, file.size]
    );

    // Process with OCR
    const ocrResult = await ocrService.processReceipt(file.path);

    if (ocrResult.success) {
      // Generate savings analysis using AI
      const analysisPrompt = `Analysiere diesen Kassenbon und gib Spartipps:

Kassenbon-Daten:
${JSON.stringify(ocrResult.processed_data, null, 2)}

Gib konkrete Spartipps für die eingekauften Artikel und allgemeine Einkaufstipps.`;

      const analysis = await aiService.generatePriceComparison(analysisPrompt, req.user.location);

      // Update file record with OCR results
      await db.run(
        'UPDATE uploaded_files SET processed = 1, ocr_result = ? WHERE id = ?',
        [JSON.stringify({ ocr_result: ocrResult, analysis: analysis }), fileRecord.id]
      );

      console.log(`✅ Receipt processed successfully for user ${userId}`);

      res.json({
        success: true,
        file_id: fileRecord.id,
        ocr_result: ocrResult,
        analysis: {
          savings_analysis: {
            general_tips: [
              `Gesamtausgabe: ${ocrResult.processed_data.total_amount}€`,
              "Vergleichen Sie Preise in verschiedenen Geschäften",
              "Achten Sie auf Angebote und Rabatte",
              "Kaufen Sie saisonale Produkte"
            ],
            recommendations: ocrResult.processed_data.items.map(item => ({
              item: item.name,
              suggestion: `${item.name} - Preis vergleichen bei anderen Anbietern`,
              estimated_savings: "0.20-0.50€"
            }))
          }
        }
      });
    } else {
      res.status(500).json({ error: 'OCR processing failed' });
    }

  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

// Get OCR result by file ID
router.get('/result/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await db.get(
      'SELECT * FROM uploaded_files WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ocrResult = file.ocr_result ? JSON.parse(file.ocr_result) : null;

    res.json({
      success: true,
      file: {
        id: file.id,
        original_name: file.original_name,
        processed: file.processed,
        created_at: file.created_at
      },
      result: ocrResult
    });

  } catch (error) {
    console.error('Error getting OCR result:', error);
    res.status(500).json({ error: 'Failed to get OCR result' });
  }
});

module.exports = router;