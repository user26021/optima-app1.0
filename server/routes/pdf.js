const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Rate limiting for PDF generation
const pdfRateLimit = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Max 20 PDF generations per 10 minutes
  message: 'Too many PDF generation requests'
});

// Simple PDF generation endpoint (Mock implementation for MVP)
router.post('/generate', authMiddleware, pdfRateLimit, async (req, res) => {
  try {
    const { type, data } = req.body;
    const userInfo = {
      name: req.user.name,
      email: req.user.email
    };

    console.log(`📄 Generating PDF: ${type} for user ${req.user.id}`);

    // Mock PDF generation - in real implementation würde hier Puppeteer verwendet
    const mockPdfContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${type} - ${userInfo.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2563eb; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .content { margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 ${type.replace('_', ' ').toUpperCase()}</h1>
        <p><strong>Erstellt für:</strong> ${userInfo.name}</p>
        <p><strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
    </div>
    <div class="content">
        <h2>Plan Details</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        <p><em>Generiert von Optima App</em></p>
    </div>
</body>
</html>`;

    // In production würde hier ein echtes PDF generiert
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      message: 'PDF generated successfully (Mock)',
      download_url: `/api/pdf/download/${Date.now()}`,
      html_preview: mockPdfContent
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Mock download endpoint
router.get('/download/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="optima_plan_${id}.txt"`);
  
  res.send(`Optima Plan - Generated at ${new Date().toISOString()}
  
This is a mock PDF download for development.
In production, this would be a real PDF file.

Plan ID: ${id}
Generated for: ${req.user.name}
Email: ${req.user.email}

Thank you for using Optima!`);
});

module.exports = router;