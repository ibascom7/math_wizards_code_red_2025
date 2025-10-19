/**
 * KeywordDetector - STEM keyword detection in extracted text
 * Cloudflare Worker compatible version
 *
 * Detects STEM keywords in text using the field keywords database
 * Matches words against known STEM terminology and returns matches with positions
 *
 * @module KeywordDetector
 */

import { FIELD_KEYWORDS, getAllFields } from './fieldKeywords.js';

/**
 * KeywordDetector class for identifying STEM keywords in text
 * Uses the field keywords database for matching
 */
export class KeywordDetector {
  /**
   * Create a KeywordDetector instance
   * @param {Object} [config={}] - Configuration options
   * @param {string[]} [config.targetFields] - Specific STEM fields to focus on (empty = all fields)
   * @param {number} [config.minConfidence=0.7] - Minimum confidence threshold for matches
   * @param {boolean} [config.caseSensitive=false] - Case-sensitive matching
   * @param {boolean} [config.multiWordMatching=true] - Enable multi-word phrase matching
   */
  constructor(config = {}) {
    this.targetFields = config.targetFields || getAllFields();
    this.minConfidence = config.minConfidence || 0.7;
    this.caseSensitive = config.caseSensitive || false;
    this.multiWordMatching = config.multiWordMatching !== false; // Default true

    // Build keyword index for efficient matching
    this._buildKeywordIndex();
  }

  /**
   * Build an index of keywords for efficient searching
   * @private
   */
  _buildKeywordIndex() {
    this.keywordIndex = new Map();

    // Index all keywords from target fields
    this.targetFields.forEach(field => {
      const keywords = FIELD_KEYWORDS[field];
      if (keywords) {
        keywords.forEach(keyword => {
          const normalizedKeyword = this.caseSensitive ? keyword : keyword.toLowerCase();

          if (!this.keywordIndex.has(normalizedKeyword)) {
            this.keywordIndex.set(normalizedKeyword, []);
          }

          this.keywordIndex.get(normalizedKeyword).push({
            field,
            keyword: keyword,
            wordCount: keyword.split(/\s+/).length
          });
        });
      }
    });
  }

  /**
   * Detect STEM keywords in word array with positions
   * @param {Array<Object>} words - Array of word objects with positions
   * @param {string} words[].text - Word text
   * @param {number} words[].x - X position
   * @param {number} words[].y - Y position
   * @param {number} words[].width - Width
   * @param {number} words[].height - Height
   * @returns {Array<Object>} Detected keywords with positions and metadata
   *
   * @example
   * const detector = new KeywordDetector({ targetFields: ['machine learning'] });
   * const keywords = detector.detectKeywords(words);
   * // [
   * //   {
   * //     text: 'neural network',
   * //     field: 'machine learning',
   * //     confidence: 0.95,
   * //     position: { x: 50, y: 100, width: 140, height: 20 },
   * //     wordIndices: [0, 1]
   * //   }
   * // ]
   */
  detectKeywords(words) {
    if (!words || !Array.isArray(words)) {
      throw new Error('words must be an array of word objects');
    }

    const detectedKeywords = [];
    const processedIndices = new Set();

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
          const normalizedPhrase = this.caseSensitive ? phraseText : phraseText.toLowerCase();

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
                wordIndices: Array.from({ length: phraseLength }, (_, j) => i + j)
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

        const normalizedWord = this.caseSensitive ? word.text : word.text.toLowerCase();
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
                height: word.height
              },
              wordIndices: [index]
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
   * @private
   * @param {Array<Object>} words - Words to bound
   * @returns {Object} Bounding box {x, y, width, height}
   */
  _calculateBoundingBox(words) {
    if (words.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    if (words.length === 1) {
      return {
        x: words[0].x,
        y: words[0].y,
        width: words[0].width,
        height: words[0].height
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
      height: maxY - minY
    };
  }

  /**
   * Calculate confidence score for a phrase
   * @private
   * @param {Array<Object>} words - Words in phrase
   * @returns {number} Confidence score (0-1)
   */
  _calculateConfidence(words) {
    if (words.length === 0) return 0;

    // Average confidence of individual words
    const totalConfidence = words.reduce((sum, word) => {
      return sum + (word.confidence || 0.9);
    }, 0);

    return totalConfidence / words.length;
  }

  /**
   * Get statistics about detected keywords
   * @param {Array<Object>} keywords - Detected keywords
   * @returns {Object} Statistics
   */
  getStatistics(keywords) {
    const fieldCounts = {};
    let totalConfidence = 0;

    keywords.forEach(kw => {
      fieldCounts[kw.field] = (fieldCounts[kw.field] || 0) + 1;
      totalConfidence += kw.confidence;
    });

    return {
      total: keywords.length,
      byField: fieldCounts,
      averageConfidence: keywords.length > 0 ? totalConfidence / keywords.length : 0,
      uniqueTerms: new Set(keywords.map(kw => kw.normalizedText)).size
    };
  }

  /**
   * Update target fields for detection
   * @param {string[]} fields - New target fields
   */
  setTargetFields(fields) {
    this.targetFields = fields;
    this._buildKeywordIndex();
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      targetFields: this.targetFields,
      minConfidence: this.minConfidence,
      caseSensitive: this.caseSensitive,
      multiWordMatching: this.multiWordMatching,
      indexedKeywords: this.keywordIndex.size
    };
  }
}

/**
 * Factory function for creating KeywordDetector instances
 * @param {Object} config - Configuration options
 * @returns {KeywordDetector} New KeywordDetector instance
 */
export function createDetector(config = {}) {
  return new KeywordDetector(config);
}

export default KeywordDetector;
