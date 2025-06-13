// Vereinfachter OCR Service - für MVP ohne komplexe OCR
class OCRService {
  /**
   * Mock OCR processing for receipts
   */
  async processReceipt(imagePath) {
    try {
      console.log(`📷 Processing receipt: ${imagePath}`);
      
      // Mock OCR result - in real implementation würde hier Tesseract.js verwendet
      const mockResult = {
        success: true,
        raw_text: `REWE Markt
Musterstraße 123
12345 Musterstadt

Milch 1,5L        2.99€
Brot 500g         1.79€
Äpfel 1kg         3.49€
Joghurt 500ml     0.89€

SUMME:            9.16€
Gegeben:         10.00€
Rückgeld:         0.84€

Vielen Dank für Ihren Einkauf!`,
        confidence: 85,
        processed_data: {
          store_name: 'REWE',
          date: new Date().toLocaleDateString('de-DE'),
          items: [
            { name: 'Milch 1,5L', price: 2.99 },
            { name: 'Brot 500g', price: 1.79 },
            { name: 'Äpfel 1kg', price: 3.49 },
            { name: 'Joghurt 500ml', price: 0.89 }
          ],
          total_amount: 9.16
        },
        word_count: 25,
        processing_time: 1200
      };

      console.log(`✅ OCR processing completed`);
      return mockResult;

    } catch (error) {
      console.error('Error processing receipt:', error);
      throw error;
    }
  }

  /**
   * Validate uploaded image file
   */
  async validateImageFile(filePath) {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      // Check file size (max 10MB)
      if (fileSizeInMB > 10) {
        throw new Error('File size too large. Maximum 10MB allowed.');
      }

      return {
        valid: true,
        format: 'image',
        size: stats.size
      };

    } catch (error) {
      console.error('Error validating image file:', error);
      throw error;
    }
  }

  /**
   * Get OCR service status
   */
  getServiceInfo() {
    return {
      service: 'Mock OCR Service',
      supported_languages: ['deu', 'eng'],
      supported_formats: ['jpeg', 'jpg', 'png'],
      max_file_size: '10MB',
      features: [
        'Receipt text extraction (Mock)',
        'Item and price recognition',
        'Store name detection',
        'Image validation'
      ]
    };
  }
}

module.exports = new OCRService();