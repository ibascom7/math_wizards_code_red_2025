/**
 * KeywordDetector - STEM keyword detection in extracted text
 * Cloudflare Worker compatible version
 *
 * Detects STEM keywords in text using the field keywords database
 * Matches words against known STEM terminology and returns matches with positions
 */

import { FIELD_KEYWORDS, getAllFields } from './fieldKeywords';

/**
 * Word object with position data
 */
export interface Word {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

/**
 * Position/bounding box
 */
export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Detected keyword result
 */
export interface DetectedKeyword {
  text: string;
  normalizedText: string;
  field: string;
  confidence: number;
  position: Position;
  wordIndices: number[];
}

/**
 * Keyword match metadata
 */
interface KeywordMatch {
  field: string;
  keyword: string;
  wordCount: number;
}

/**
 * Configuration options for KeywordDetector
 */
export interface DetectorConfig {
  targetFields?: string[];
  minConfidence?: number;
  caseSensitive?: boolean;
  multiWordMatching?: boolean;
}

/**
 * Statistics about detected keywords
 */
export interface KeywordStatistics {
  total: number;
  byField: Record<string, number>;
  averageConfidence: number;
  uniqueTerms: number;
}

/**
 * KeywordDetector class for identifying STEM keywords in text
 */
export class KeywordDetector {
  private targetFields: string[];
  private minConfidence: number;
  private caseSensitive: boolean;
  private multiWordMatching: boolean;
  private keywordIndex: Map<string, KeywordMatch[]>;

  /**
   * Create a KeywordDetector instance
   */
  constructor(config: DetectorConfig = {}) {
    this.targetFields = config.targetFields || getAllFields();
    this.minConfidence = config.minConfidence ?? 0.7;
    this.caseSensitive = config.caseSensitive ?? false;
    this.multiWordMatching = config.multiWordMatching ?? true;
    this.keywordIndex = new Map();

    // Build keyword index for efficient matching
    this._buildKeywordIndex();
  }

  /**
   * Build an index of keywords for efficient searching
   */
  private _buildKeywordIndex(): void {
    this.keywordIndex = new Map();

    // Index all keywords from target fields
    this.targetFields.forEach(field => {
      const keywords = FIELD_KEYWORDS[field];
      if (keywords) {
        keywords.forEach(keyword => {
          const normalizedKeyword = this.caseSensitive
            ? keyword
            : keyword.toLowerCase();

          if (!this.keywordIndex.has(normalizedKeyword)) {
            this.keywordIndex.set(normalizedKeyword, []);
          }

          this.keywordIndex.get(normalizedKeyword)!.push({
            field,
            keyword: keyword,
            wordCount: keyword.split(/\s+/).length,
          });
        });
      }
    });
  }

  /**
   * Detect STEM keywords in word array with positions
   */
  detectKeywords(words: Word[]): DetectedKeyword[] {
    if (!words || !Array.isArray(words)) {
      throw new Error('words must be an array of word objects');
    }

    const detectedKeywords: DetectedKeyword[] = [];
    const processedIndices = new Set<number>();

    // Multi-word phrase matching
    if (this.multiWordMatching) {
      // Try matching phrases up to 4 words long
      for (let phraseLength = 4; phraseLength >= 1; phraseLength--) {
        for (let i = 0; i <= words.length - phraseLength; i++) {
          // Skip if any word in this range was already matched
          let alreadyMatched = false;
          for (let j = i; j < i + phraseLength; j++) {
            if (processedIndices.has(j)) {
              alreadyMatched = true;
              break;
            }
          }
          if (alreadyMatched) continue;

          // Build phrase from consecutive words
          const phraseWords = words.slice(i, i + phraseLength);
          const phraseText = phraseWords.map(w => w.text).join(' ');
          const normalizedPhrase = this.caseSensitive
            ? phraseText
            : phraseText.toLowerCase();

          // Check if phrase matches any keyword
          const matches = this.keywordIndex.get(normalizedPhrase);
          if (matches && matches.length > 0) {
            // Calculate bounding box for phrase
            const position = this._calculateBoundingBox(phraseWords);

            // Add detection for each matching field
            matches.forEach(match => {
              detectedKeywords.push({
                text: match.keyword,
                normalizedText: normalizedPhrase,
                field: match.field,
                confidence: this._calculateConfidence(phraseWords),
                position,
                wordIndices: Array.from(
                  { length: phraseLength },
                  (_, j) => i + j
                ),
              });
            });

            // Mark these words as processed
            for (let j = i; j < i + phraseLength; j++) {
              processedIndices.add(j);
            }
          }
        }
      }
    } else {
      // Single-word matching only
      words.forEach((word, index) => {
        if (processedIndices.has(index)) return;

        const normalizedWord = this.caseSensitive
          ? word.text
          : word.text.toLowerCase();
        const matches = this.keywordIndex.get(normalizedWord);

        if (matches && matches.length > 0) {
          matches.forEach(match => {
            detectedKeywords.push({
              text: match.keyword,
              normalizedText: normalizedWord,
              field: match.field,
              confidence: word.confidence || 0.9,
              position: {
                x: word.x,
                y: word.y,
                width: word.width,
                height: word.height,
              },
              wordIndices: [index],
            });
          });

          processedIndices.add(index);
        }
      });
    }

    // Filter by confidence threshold and sort by position
    return detectedKeywords
      .filter(kw => kw.confidence >= this.minConfidence)
      .sort((a, b) => {
        // Sort by Y position, then X position
        if (a.position.y !== b.position.y) {
          return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
      });
  }

  /**
   * Calculate bounding box for multiple words
   */
  private _calculateBoundingBox(words: Word[]): Position {
    if (words.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    if (words.length === 1) {
      return {
        x: words[0].x,
        y: words[0].y,
        width: words[0].width,
        height: words[0].height,
      };
    }

    // Find min/max coordinates
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    words.forEach(word => {
      minX = Math.min(minX, word.x);
      minY = Math.min(minY, word.y);
      maxX = Math.max(maxX, word.x + word.width);
      maxY = Math.max(maxY, word.y + word.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Calculate confidence score for a phrase
   */
  private _calculateConfidence(words: Word[]): number {
    if (words.length === 0) return 0;

    // Average confidence of individual words
    const totalConfidence = words.reduce((sum, word) => {
      return sum + (word.confidence || 0.9);
    }, 0);

    return totalConfidence / words.length;
  }

  /**
   * Get statistics about detected keywords
   */
  getStatistics(keywords: DetectedKeyword[]): KeywordStatistics {
    const fieldCounts: Record<string, number> = {};
    let totalConfidence = 0;

    keywords.forEach(kw => {
      fieldCounts[kw.field] = (fieldCounts[kw.field] || 0) + 1;
      totalConfidence += kw.confidence;
    });

    return {
      total: keywords.length,
      byField: fieldCounts,
      averageConfidence: keywords.length > 0
        ? totalConfidence / keywords.length
        : 0,
      uniqueTerms: new Set(keywords.map(kw => kw.normalizedText)).size,
    };
  }

  /**
   * Update target fields for detection
   */
  setTargetFields(fields: string[]): void {
    this.targetFields = fields;
    this._buildKeywordIndex();
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      targetFields: this.targetFields,
      minConfidence: this.minConfidence,
      caseSensitive: this.caseSensitive,
      multiWordMatching: this.multiWordMatching,
      indexedKeywords: this.keywordIndex.size,
    };
  }
}

/**
 * Factory function for creating KeywordDetector instances
 */
export function createDetector(config: DetectorConfig = {}): KeywordDetector {
  return new KeywordDetector(config);
}

export default KeywordDetector;
