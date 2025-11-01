import {
  OCRResult,
  BoundingBox,
  ExtractedData,
} from '@/types';
import Tesseract from 'tesseract.js';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { logger } from '@/utils/logger.enhanced';
import { withRetry } from '@/utils/retryWrapper';

// AI-Powered OCR Service for Construction Documents with Performance Optimizations
export class OptimizedOCRService {
  private supportedFormats: string[] = ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'bmp'];
  private tesseractWorker: Tesseract.Worker | null = null;
  private processingStatus: Map<string, { status: string; progress: number; result?: any }> =
    new Map();
  private workerPool: Tesseract.Worker[] = [];
  private maxWorkers: number = 2; // Limit concurrent workers to prevent memory issues

  constructor() {
    // Initialize Tesseract workers
    this.initializeTesseractWorkers();
  }

  /**
   * Initialize multiple Tesseract.js workers for parallel processing
   */
  private async initializeTesseractWorkers(): Promise<void> {
    try {
      logger.info('Initializing Tesseract worker pool', { workerCount: this.maxWorkers });

      // Create multiple workers for parallel processing
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              logger.debug('OCR Progress', { progress: Math.round(m.progress * 100) });
            }
          },
          cacheMethod: 'none', // Disable cache to reduce memory usage
        });
        this.workerPool.push(worker);
      }

      logger.info('Tesseract worker pool initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Tesseract worker pool', error as Error);
    }
  }

  /**
   * Get available worker from pool
   */
  private async getWorker(): Promise<Tesseract.Worker> {
    if (this.workerPool.length > 0) {
      return this.workerPool.pop() as Tesseract.Worker;
    }

    // If no workers available, create a new one (fallback)
    logger.warn('No available workers in pool, creating new worker');
    return await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.debug('OCR Progress', { progress: Math.round(m.progress * 100) });
        }
      },
    });
  }

  /**
   * Return worker to pool
   */
  private returnWorker(worker: Tesseract.Worker): void {
    if (this.workerPool.length < this.maxWorkers) {
      this.workerPool.push(worker);
    } else {
      // If pool is full, terminate the worker
      worker.terminate();
    }
  }

  /**
   * Cleanup all Tesseract workers
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up Tesseract workers');

    // Terminate all workers in the pool
    for (const worker of this.workerPool) {
      await worker.terminate();
    }
    this.workerPool = [];

    logger.info('Tesseract workers cleaned up successfully');
  }

  /**
   * Process document with optimized OCR
   */
  async processDocument(file: File, documentId: string): Promise<APIResponse<OCRResult>> {
    return await safeAsync(async () => {
      const startTime = Date.now();
      const ocrId = this.generateId();

      logger.info('Starting OCR processing', { documentId, fileName: file.name, fileSize: file.size });

      // Initialize status tracking
      this.processingStatus.set(ocrId, { status: 'processing', progress: 0 });

      try {
        // Validate file format
        if (!this.isValidFormat(file)) {
          throw new APIError(ErrorCodes.INVALID_INPUT, `Unsupported format: ${file.type}`, 400);
        }

        // Validate file size (limit to 50MB for performance)
        if (file.size > 50 * 1024 * 1024) {
          throw new APIError(ErrorCodes.INVALID_INPUT, 'File size exceeds 50MB limit', 400);
        }

        // Update progress: Pre-processing
        this.processingStatus.set(ocrId, { status: 'preprocessing', progress: 10 });

        // Pre-process image for better OCR results with optimizations
        const processedFile = await this.preprocessImageOptimized(file);

        // Update progress: OCR processing
        this.processingStatus.set(ocrId, { status: 'recognizing', progress: 30 });

        // Extract text using OCR with worker pooling
        const ocrResponse = await this.performOCROptimized(processedFile);

        // Update progress: Data extraction
        this.processingStatus.set(ocrId, { status: 'extracting', progress: 70 });

        // Extract structured data from text with optimizations
        const extractedData = await this.extractStructuredDataOptimized(
          ocrResponse.text,
          ocrResponse.boundingBoxes
        );

        // Calculate processing time
        const processingTime = Date.now() - startTime;

        const result: OCRResult = {
          id: ocrId,
          documentId,
          extractedText: ocrResponse.text,
          confidence: ocrResponse.confidence,
          boundingBoxes: ocrResponse.boundingBoxes,
          extractedData,
          processingTime,
          timestamp: new Date(),
          status: 'completed',
        };

        // Update status: Completed
        this.processingStatus.set(ocrId, { status: 'completed', progress: 100, result });

        logger.info('OCR processing completed successfully', { 
          documentId, 
          processingTime,
          confidence: ocrResponse.confidence 
        });

        return result;
      } catch (error) {
        logger.error('OCR processing failed', error as Error, { documentId });

        const result: any = {
          id: ocrId,
          documentId,
          extractedText: '',
          confidence: 0,
          boundingBoxes: [],
          extractedData: {},
          processingTime: Date.now() - startTime,
          timestamp: new Date(),
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };

        // Update status: Failed
        this.processingStatus.set(ocrId, { status: 'failed', progress: 0, result });

        throw error;
      }
    }, 'optimizedOcrService.processDocument');
  }

  /**
   * Validate file format
   */
  private isValidFormat(file: File): boolean {
    const extension = file.name.toLowerCase().split('.').pop();
    return extension ? this.supportedFormats.includes(extension) : false;
  }

  /**
   * Optimized image pre-processing for better OCR accuracy
   */
  private async preprocessImageOptimized(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Optimize image size for OCR (max 2000px in either dimension)
        const maxWidth = 2000;
        const maxHeight = 2000;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image with optimized quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Apply image enhancements
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Enhanced preprocessing for construction documents
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale for better OCR
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // Apply threshold to enhance text
          const threshold = gray > 128 ? 255 : 0;
          
          data[i] = threshold;     // Red
          data[i + 1] = threshold; // Green
          data[i + 2] = threshold; // Blue
          // Alpha channel (data[i + 3]) remains unchanged
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob with optimized quality
        canvas.toBlob((blob) => {
          if (blob) {
            const enhancedFile = new File([blob], file.name, { type: 'image/png' });
            resolve(enhancedFile);
          } else {
            resolve(file);
          }
        }, 'image/png', 0.8); // 80% quality for balance between size and quality
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Perform OCR using Tesseract.js with worker pooling and optimizations
   */
  private async performOCROptimized(
    file: File
  ): Promise<{ text: string; confidence: number; boundingBoxes: BoundingBox[] }> {
    const worker = await this.getWorker();
    
    try {
      logger.debug('Performing OCR with worker');

      // Set OCR parameters for better performance on construction documents
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // Optimize for single block of text
        tessedit_ocr_engine_mode: Tesseract.OEM.TESSERACT_ONLY, // Use Tesseract only for speed
        preserve_interword_spaces: '1', // Preserve spaces between words
      });

      const result = await withRetry(
        () => worker.recognize(file),
        { maxAttempts: 3 }
      );

      // Extract bounding boxes and confidence
      const boundingBoxes: BoundingBox[] = [];
      let totalConfidence = 0;
      let wordCount = 0;

      // Extract bounding boxes from Tesseract result
      const resultData: any = result.data;

      if (resultData && resultData.words) {
        resultData.words.forEach((word: any) => {
          if (word.text && word.text.trim()) {
            boundingBoxes.push({
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
              text: word.text,
              confidence: word.confidence / 100, // Normalize to 0-1
            });
            
            totalConfidence += word.confidence;
            wordCount++;
          }
        });
      }

      const averageConfidence = wordCount > 0 ? totalConfidence / wordCount / 100 : 0;

      logger.debug('OCR completed', { 
        confidence: averageConfidence, 
        wordCount 
      });

      return {
        text: result.data.text,
        confidence: averageConfidence,
        boundingBoxes,
      };
    } catch (error) {
      logger.error('OCR failed', error as Error);
      throw error;
    } finally {
      // Return worker to pool
      this.returnWorker(worker);
    }
  }

  /**
   * Optimized structured data extraction from OCR text
   */
  private async extractStructuredDataOptimized(
    text: string,
    boundingBoxes: BoundingBox[]
  ): Promise<ExtractedData> {
    logger.debug('Extracting structured data from OCR text', { textLength: text.length });

    // Early return for empty text
    if (!text.trim()) {
      return {};
    }

    // Extract data in parallel with optimizations
    const [
      dates,
      amounts,
      materials,
      personnel,
      coordinates,
      specifications,
      signatures,
      tables
    ] = await Promise.all([
      this.extractDatesOptimized(text),
      this.extractAmountsOptimized(text),
      this.extractMaterialsOptimized(text),
      this.extractPersonnelOptimized(text),
      this.extractCoordinatesOptimized(text),
      this.extractSpecificationsOptimized(text),
      this.extractSignaturesOptimized(text, boundingBoxes),
      this.extractTablesOptimized(text),
    ]);

    const extractedData: ExtractedData = {
      dates,
      amounts,
      materials,
      personnel,
      coordinates,
      specifications,
      signatures,
      tables,
    };

    logger.debug('Structured data extraction completed', { 
      extractedItems: Object.keys(extractedData).length 
    });

    return extractedData;
  }

  /**
   * Optimized date extraction
   */
  private async extractDatesOptimized(text: string): Promise<any[]> {
    // Indonesian and international date patterns
    const datePatterns = [
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, // DD/MM/YYYY or DD-MM-YYYY
      /\b\d{1,2}[\/\-](Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)[\/\-]\d{2,4}\b/gi, // DD/MMM/YYYY
      /\b(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{1,2},?\s+\d{2,4}\b/gi, // MMM DD, YYYY
      /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g, // YYYY-MM-DD
    ];

    const dates: any[] = [];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          dates.push({
            value: match,
            type: 'other',
            confidence: 0.8,
          });
        }
      }
    }

    return dates;
  }

  /**
   * Optimized amount extraction
   */
  private async extractAmountsOptimized(text: string): Promise<any[]> {
    // Indonesian currency patterns (Rp) and international
    const amountPatterns = [
      /Rp\.?\s*[\d.,]+/gi, // Rp 1.000.000
      /\$\s*[\d.,]+/g, // $ 1,000,000
      /[\d.,]+\s*(IDR|USD|EUR)/gi, // 1.000.000 IDR
      /\b\d+(?:\.\d{3})*(?:,\d{1,2})?\b/g, // 1.000.000,00
    ];

    const amounts: any[] = [];
    
    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          amounts.push({
            value: match,
            currency: this.detectCurrency(match),
            type: 'other',
            confidence: 0.85,
          });
        }
      }
    }

    return amounts;
  }

  /**
   * Detect currency from amount string
   */
  private detectCurrency(amount: string): string {
    if (amount.includes('Rp') || amount.includes('IDR')) return 'IDR';
    if (amount.includes('$') || amount.includes('USD')) return 'USD';
    if (amount.includes('€') || amount.includes('EUR')) return 'EUR';
    return 'IDR'; // Default to IDR
  }

  /**
   * Optimized material extraction (construction-specific)
   */
  private async extractMaterialsOptimized(text: string): Promise<any[]> {
    // Common construction materials in Indonesian and English
    const materialKeywords = [
      'semen', 'beton', 'baja', 'kayu', 'batu bata', 'genteng', 'atap', 'pintu', 'jendela',
      'keramik', 'cat', 'besi', 'kabel', 'pipa', 'granit', 'marmer', 'aluminium', 'kaca',
      'cement', 'concrete', 'steel', 'wood', 'brick', 'roof', 'door', 'window', 'tile', 'paint'
    ];

    const materials: any[] = [];
    const lowerText = text.toLowerCase();

    for (const keyword of materialKeywords) {
      if (lowerText.includes(keyword)) {
        materials.push({
          name: keyword,
          confidence: 0.7,
        });
      }
    }

    return materials;
  }

  /**
   * Optimized personnel extraction
   */
  private async extractPersonnelOptimized(text: string): Promise<any[]> {
    // Common construction roles in Indonesian and English
    const roleKeywords = [
      'mandor', 'foreman', 'supervisor', 'engineer', 'arsitek', 'insinyur', 'pekerja', 'worker',
      'manager', 'direktur', 'director', 'koordinator', 'coordinator', 'pengawas', 'inspector'
    ];

    const personnel: any[] = [];
    const lowerText = text.toLowerCase();

    for (const keyword of roleKeywords) {
      if (lowerText.includes(keyword)) {
        personnel.push({
          name: keyword,
          role: keyword,
          confidence: 0.65,
        });
      }
    }

    return personnel;
  }

  /**
   * Optimized coordinate extraction
   */
  private async extractCoordinatesOptimized(text: string): Promise<any[]> {
    // GPS coordinate patterns
    const coordinatePatterns = [
      /[-+]?(?:\d+\.?\d*)[°\s]+(?:\d+\.?\d*)['\s]+(?:\d+\.?\d*)["\s]+[NSEW]/gi, // DMS format
      /[-+]?\d+\.\d+[,\/]\s*[-+]?\d+\.\d+/g, // Decimal format
    ];

    const coordinates: any[] = [];
    
    for (const pattern of coordinatePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          coordinates.push({
            value: match,
            confidence: 0.9,
          });
        }
      }
    }

    return coordinates;
  }

  /**
   * Optimized specification extraction
   */
  private async extractSpecificationsOptimized(text: string): Promise<any[]> {
    // Common specification patterns
    const specPatterns = [
      /\b\d+(?:\.\d+)?\s*(?:mm|cm|m|kg|ton|liter|buah|unit|pcs|set)\b/gi, // Measurements
      /\b(?:grade|kelas|class)\s*[A-Z0-9]+\b/gi, // Grades
      /\b(?:SNI|ISO|ASTM)\s*[-:]?\s*[A-Z0-9\-]+\b/gi, // Standards
    ];

    const specifications: any[] = [];
    
    for (const pattern of specPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          specifications.push({
            value: match,
            type: 'technical_spec',
            confidence: 0.8,
          });
        }
      }
    }

    return specifications;
  }

  /**
   * Optimized signature extraction
   */
  private async extractSignaturesOptimized(
    text: string, 
    boundingBoxes: BoundingBox[]
  ): Promise<any[]> {
    // Look for signature indicators in text
    const signatureIndicators = ['ttd', 'signature', 'tandatangan', 'signed by'];
    const signatures: any[] = [];
    const lowerText = text.toLowerCase();

    for (const indicator of signatureIndicators) {
      if (lowerText.includes(indicator)) {
        signatures.push({
          text: indicator,
          confidence: 0.75,
        });
      }
    }

    return signatures;
  }

  /**
   * Optimized table extraction
   */
  private async extractTablesOptimized(text: string): Promise<any[]> {
    // Simple table detection based on tabular patterns
    const lines = text.split('\n');
    const tables: any[] = [];
    let currentTable: string[] = [];
    let inTable = false;

    for (const line of lines) {
      // Detect table-like structure (multiple tabs or aligned columns)
      if ((line.match(/\t/g) || []).length >= 2 || (line.match(/\s{2,}/g) || []).length >= 2) {
        if (!inTable) {
          inTable = true;
          currentTable = [];
        }
        currentTable.push(line);
      } else {
        if (inTable && currentTable.length >= 3) {
          // Consider it a table if it has at least 3 rows
          tables.push({
            content: currentTable.join('\n'),
            confidence: 0.7,
          });
        }
        inTable = false;
      }
    }

    // Handle last table if file ends with one
    if (inTable && currentTable.length >= 3) {
      tables.push({
        content: currentTable.join('\n'),
        confidence: 0.7,
      });
    }

    return tables;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const optimizedOcrService = new OptimizedOCRService();