export interface OcrParsedRow {
  rollNumber: string | null;
  studentName: string | null;
  subject: string | null;
  marks: number | null;
  confidenceScore: number; // 0 to 100
  rawLine: string;
}

export interface OcrParsedResult {
  provider: "GOOGLE_CLOUD_VISION" | "DEVELOPMENT_MOCK";
  overallConfidence: number;
  extractedRows: OcrParsedRow[];
  rawText: string;
  rawPayload?: Record<string, unknown>;
  error?: string;
}

export interface IOcrProvider {
  name: "GOOGLE_CLOUD_VISION" | "DEVELOPMENT_MOCK";
  isAvailable(): boolean;
  processDocument(fileBuffer: Buffer, mimeType: string): Promise<OcrParsedResult>;
}

/**
 * Line Parser: Utility to extract structured student row data from a single line of OCR text.
 */
export function parseOcrLine(line: string): OcrParsedRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Patterns
  // Roll Number pattern: e.g. 2024-CS-001, CS-101, REG12345, 2024CS001, 101, etc.
  const rollPattern = /\b([A-Z0-9]{2,10}[-/]?[A-Z0-9]{2,10}(?:[-/]?[A-Z0-9]{1,10})?)\b/i;
  // Marks pattern: standalone number or X/100, e.g. 85.5, 90, 88/100
  const marksPattern = /\b([0-9]{1,3}(?:\.[0-9]{1,2})?)(?:\s*\/\s*\d{2,3})?\b/g;

  const rollMatch = trimmed.match(rollPattern);
  const rollNumber = rollMatch ? rollMatch[1].toUpperCase() : null;

  // Find numbers that might be marks
  const allMarksMatches = Array.from(trimmed.matchAll(marksPattern));
  let marks: number | null = null;
  if (allMarksMatches.length > 0) {
    // If roll number matched a pure number, pick the mark that isn't the roll number
    for (const match of allMarksMatches) {
      const val = parseFloat(match[1]);
      if (val >= 0 && val <= 100 && match[1] !== rollNumber) {
        marks = val;
        break;
      }
    }
  }

  // Name: Remove roll number and marks digits, keep letters & spaces
  let nameCandidate = trimmed;
  if (rollNumber) {
    nameCandidate = nameCandidate.replace(new RegExp(rollNumber, "gi"), "");
  }
  if (marks !== null) {
    nameCandidate = nameCandidate.replace(new RegExp(`\\b${marks}\\b`, "g"), "");
  }
  nameCandidate = nameCandidate.replace(/[0-9/\\|#:_~=+\-*]/g, " ").replace(/\s+/g, " ").trim();

  const studentName = nameCandidate.length >= 2 ? nameCandidate : null;

  // Calculate simple line confidence heuristic based on how many fields were successfully identified
  let confidenceScore = 40;
  if (rollNumber) confidenceScore += 30;
  if (marks !== null) confidenceScore += 20;
  if (studentName) confidenceScore += 10;

  return {
    rollNumber,
    studentName,
    subject: null,
    marks,
    confidenceScore: Math.min(100, confidenceScore),
    rawLine: trimmed,
  };
}

/**
 * Google Cloud Vision API Provider implementation using Vision REST API.
 */
export class GoogleCloudVisionProvider implements IOcrProvider {
  name = "GOOGLE_CLOUD_VISION" as const;

  isAvailable(): boolean {
    return Boolean(
      process.env.GOOGLE_CLOUD_VISION_API_KEY ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_VISION_API_KEY
    );
  }

  async processDocument(fileBuffer: Buffer, _mimeType: string): Promise<OcrParsedResult> {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      throw new Error("Google Cloud Vision API key is not configured.");
    }

    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const base64Content = fileBuffer.toString("base64");

    const requestBody = {
      requests: [
        {
          image: { content: base64Content },
          features: [
            { type: "TEXT_DETECTION", maxResults: 1 },
            { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
          ],
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Cloud Vision API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const annotations = data.responses?.[0]?.textAnnotations;
    const fullText = annotations?.[0]?.description || "";

    const lines = fullText.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const extractedRows: OcrParsedRow[] = [];

    for (const line of lines) {
      const parsed = parseOcrLine(line);
      if (parsed && (parsed.rollNumber || parsed.marks !== null)) {
        extractedRows.push(parsed);
      }
    }

    const overallConfidence =
      extractedRows.length > 0
        ? Math.round(
            extractedRows.reduce((acc, row) => acc + row.confidenceScore, 0) / extractedRows.length
          )
        : 0;

    return {
      provider: "GOOGLE_CLOUD_VISION",
      overallConfidence,
      extractedRows,
      rawText: fullText,
      rawPayload: data,
    };
  }
}

/**
 * Development Mock Provider for local testing when Google Credentials are not present.
 */
export class DevelopmentMockOcrProvider implements IOcrProvider {
  name = "DEVELOPMENT_MOCK" as const;

  isAvailable(): boolean {
    return true;
  }

  async processDocument(fileBuffer: Buffer, _mimeType: string): Promise<OcrParsedResult> {
    // Check if buffer contains plain text lines (for testing text files)
    const rawTextContent = fileBuffer.toString("utf-8");
    const rawLines = rawTextContent.split("\n").map((l) => l.trim()).filter(Boolean);

    let extractedRows: OcrParsedRow[] = [];

    // If the uploaded file is a text/csv mock file with text content
    if (rawLines.length > 0 && rawLines.some((l) => l.includes(",") || l.includes("-") || /\d/.test(l))) {
      for (const line of rawLines) {
        const parsed = parseOcrLine(line);
        if (parsed && (parsed.rollNumber || parsed.marks !== null)) {
          extractedRows.push(parsed);
        }
      }
    }

    // Fallback: If image/binary buffer or text parsing yielded no rows, generate mock student extractions
    if (extractedRows.length === 0) {
      const mockStudents = [
        { roll: "CS2026-001", name: "Aarav Sharma", marks: 92.5, confidence: 95 },
        { roll: "CS2026-002", name: "Ananya Patel", marks: 88.0, confidence: 92 },
        { roll: "CS2026-003", name: "Rohan Verma", marks: 74.0, confidence: 86 },
        { roll: "CS2026-004", name: "Priya Nair", marks: 95.0, confidence: 98 },
        { roll: "CS2026-005", name: "Karan Gupta", marks: 62.5, confidence: 78 },
        { roll: "CS2026-006", name: "Sneha Reddy", marks: 81.0, confidence: 89 },
      ];

      extractedRows = mockStudents.map((item) => ({
        rollNumber: item.roll,
        studentName: item.name,
        subject: null,
        marks: item.marks,
        confidenceScore: item.confidence,
        rawLine: `${item.roll} | ${item.name} | Marks: ${item.marks}`,
      }));
    }

    const overallConfidence = Math.round(
      extractedRows.reduce((acc, r) => acc + r.confidenceScore, 0) / extractedRows.length
    );

    const generatedRawText = extractedRows
      .map((r) => r.rawLine)
      .join("\n");

    return {
      provider: "DEVELOPMENT_MOCK",
      overallConfidence,
      extractedRows,
      rawText: generatedRawText,
      rawPayload: {
        mockProcessedAt: new Date().toISOString(),
        totalRows: extractedRows.length,
      },
    };
  }
}

/**
 * Main OCR Service Class with Provider Abstraction & Fallback
 */
export class OcrService {
  private primaryProvider: IOcrProvider;
  private fallbackProvider: IOcrProvider;

  constructor() {
    this.primaryProvider = new GoogleCloudVisionProvider();
    this.fallbackProvider = new DevelopmentMockOcrProvider();
  }

  async processDocument(fileBuffer: Buffer, mimeType: string): Promise<OcrParsedResult> {
    if (!fileBuffer || fileBuffer.length === 0) {
      return {
        provider: "DEVELOPMENT_MOCK",
        overallConfidence: 0,
        extractedRows: [],
        rawText: "",
        error: "File buffer is empty or invalid.",
      };
    }

    if (this.primaryProvider.isAvailable()) {
      try {
        return await this.primaryProvider.processDocument(fileBuffer, mimeType);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error in Google Cloud Vision provider.";
        console.warn(`[OcrService] Primary provider failed, using fallback: ${errorMessage}`);
        const fallbackResult = await this.fallbackProvider.processDocument(fileBuffer, mimeType);
        return {
          ...fallbackResult,
          error: `Primary provider error: ${errorMessage}. Used development fallback.`,
        };
      }
    }

    return await this.fallbackProvider.processDocument(fileBuffer, mimeType);
  }
}

export const ocrService = new OcrService();
