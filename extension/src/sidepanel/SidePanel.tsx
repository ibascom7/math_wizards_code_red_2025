import React, { useState, useEffect, useRef } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { marked } from 'marked';
import 'katex/dist/katex.min.css';

interface PDFInfo {
  url: string;
  type: 'embed' | 'object' | 'iframe' | 'link' | 'direct' | 'viewer';
  text?: string;
  images?: string[];
}

interface KeywordLink {
  title: string;
  url: string;
  snippet: string;
  displayLink: string;
  relevanceScore: number;
}

interface KeywordResult {
  keyword: string;
  field?: string;
  highlights: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
  }>;
  links: KeywordLink[];
  searchQuery: string;
}

const SidePanel: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<number | null>(null);
  const [latex, setLatex] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [ttsDropdownOpen, setTtsDropdownOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [detectingKeywords, setDetectingKeywords] = useState(false);
  const [fetchingLinks, setFetchingLinks] = useState(false);
  const latexContainerRef = useRef<HTMLDivElement>(null);
  const explanationContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scanForPDFs = async () => {
    setScanning(true);
    setError(null);
    setPdfs([]);

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id || !tab.url) {
        throw new Error('No active tab found');
      }

      // First, try to inject the content script if it's not already there
      // This is necessary for PDF pages which don't automatically get content scripts
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('Content script injected');
      } catch (injectError) {
        // Script might already be injected, that's okay
        console.log('Content script injection skipped (might already exist):', injectError);
      }

      // Give the content script a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send message to content script to scan for PDFs
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanPDFs' });

      if (response && response.pdfs) {
        setPdfs(response.pdfs);
      } else {
        // Fallback: check if current page is a PDF by URL
        if (tab.url.toLowerCase().endsWith('.pdf') ||
            tab.url.includes('.pdf?') ||
            tab.url.includes('.pdf#')) {
          setPdfs([{
            url: tab.url,
            type: 'direct',
            text: 'Current PDF Document'
          }]);
        }
      }
    } catch (err) {
      // Better error message
      const errorMsg = err instanceof Error ? err.message : 'Failed to scan for PDFs';

      // If connection failed, might be a restricted page
      if (errorMsg.includes('Receiving end does not exist')) {
        setError('Cannot scan this page (try a different page or refresh)');
      } else {
        setError(errorMsg);
      }

      console.error('Error scanning for PDFs:', err);
    } finally {
      setScanning(false);
    }
  };

  const extractLatexFromPage = async (pdfIndex: number) => {
    setExtracting(pdfIndex);
    setError(null);
    setLatex(null);

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id || !tab.url) {
        throw new Error('No active tab found');
      }

      // Check if this is a direct PDF file
      const currentUrl = tab.url;
      const isDirectPdf = currentUrl.toLowerCase().includes('.pdf') ||
                         currentUrl.includes('.pdf?') ||
                         currentUrl.includes('.pdf#') ||
                         currentUrl.includes('/pdf/');

      let base64Image: string;

      if (isDirectPdf) {
        // DIRECT PDF: Capture full page and crop out Chrome's PDF toolbar
        console.log('Direct PDF detected - capturing page and removing toolbar');

        const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
          format: 'png'
        });

        // Chrome's PDF viewer has a toolbar at the top (~56-60px)
        // We'll crop it out
        const toolbarHeight = 56;

        // Get viewport dimensions
        const viewportInfo = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              width: window.innerWidth,
              height: window.innerHeight
            };
          }
        });

        const viewport = viewportInfo[0].result as { width: number; height: number };

        // Crop out the toolbar from the top
        base64Image = await cropImage(
          screenshotUrl,
          0, // x: start at left edge
          toolbarHeight, // y: skip the toolbar
          viewport.width, // width: full width
          viewport.height - toolbarHeight // height: full height minus toolbar
        );

        console.log('PDF screenshot captured with toolbar removed, base64 length:', base64Image.length);

      } else {
        // EMBEDDED VIEWER: Find the viewer element and crop to it
        console.log('Embedded viewer - finding viewer element');

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Try to find the PDF/document viewer element

            // 1. Check for iframe (Canvas, embedded PDFs)
            const iframe = document.querySelector('iframe[src*=".pdf"], iframe[src*="canvadoc"], iframe[src*="preview"]') as HTMLIFrameElement;
            if (iframe) {
              const rect = iframe.getBoundingClientRect();
              return { found: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            }

            // 2. Check for Canvas Canvadoc viewer
            const canvadocIframe = document.querySelector('iframe[src*="canvadoc"]') as HTMLElement;
            if (canvadocIframe) {
              const rect = canvadocIframe.getBoundingClientRect();
              return { found: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            }

            // 3. Check for embed/object tags
            const embed = document.querySelector('embed[type="application/pdf"]') as HTMLElement;
            if (embed) {
              const rect = embed.getBoundingClientRect();
              return { found: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            }

            const object = document.querySelector('object[type="application/pdf"]') as HTMLElement;
            if (object) {
              const rect = object.getBoundingClientRect();
              return { found: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            }

            // 4. Check for Google Books viewer
            if (window.location.hostname.includes('books.google.com')) {
              const viewer = document.querySelector('.pageImageDisplay, #viewport') as HTMLElement;
              if (viewer) {
                const rect = viewer.getBoundingClientRect();
                return { found: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
              }
            }

            // 5. Fallback: largest canvas
            const canvases = Array.from(document.querySelectorAll('canvas'));
            if (canvases.length > 0) {
              const largestCanvas = canvases.reduce((largest, current) => {
                const largestArea = largest.width * largest.height;
                const currentArea = current.width * current.height;
                return currentArea > largestArea ? current : largest;
              });
              const rect = largestCanvas.getBoundingClientRect();
              return { found: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            }

            return { found: false };
          }
        });

        const pdfInfo = results[0].result as { found: boolean; x?: number; y?: number; width?: number; height?: number };

        if (!pdfInfo.found) {
          throw new Error('Could not locate viewer element. Try using on a direct PDF or viewer page.');
        }

        // Capture full screenshot
        const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
          format: 'png'
        });

        // Crop to just the viewer area
        base64Image = await cropImage(
          screenshotUrl,
          pdfInfo.x!,
          pdfInfo.y!,
          pdfInfo.width!,
          pdfInfo.height!
        );

        console.log('Viewer screenshot captured and cropped, base64 length:', base64Image.length);
      }

      // STAGE 1: Send to handwriting OCR worker first
      console.log('Stage 1: Running handwriting OCR...');
      const handwritingResponse = await fetch('https://math-wizards-handwriting-ocr.bascomisaiah.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image
        })
      });

      if (!handwritingResponse.ok) {
        const errorText = await handwritingResponse.text();
        console.error('Handwriting OCR failed:', errorText);
        throw new Error(`Handwriting OCR failed: ${handwritingResponse.status}`);
      }

      const handwritingResult = await handwritingResponse.json();
      console.log('Handwriting OCR result:', handwritingResult);

      // STAGE 2: Use handwriting OCR output with Mathpix for higher accuracy
      // Send the annotated image (with typed text overlay) to Mathpix
      console.log('Stage 2: Sending to Mathpix OCR for refinement...');

      const mathpixResponse = await fetch('https://math-wizards-ocr.bascomisaiah.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image,
          // Include the typed text from handwriting OCR as context
          handwriting_text: handwritingResult.typed_text
        })
      });

      if (!mathpixResponse.ok) {
        // If Mathpix fails, fall back to handwriting OCR results
        console.warn('Mathpix OCR failed, using handwriting OCR output');
        setLatex(handwritingResult.typed_text || 'No text detected');
      } else {
        const mathpixResult = await mathpixResponse.json();
        console.log('Mathpix OCR result:', mathpixResult);

        // Combine results: prefer Mathpix LaTeX if available, otherwise use handwriting text
        const finalLatex = mathpixResult.latex || handwritingResult.typed_text || 'No LaTeX detected';
        setLatex(finalLatex);

        // Log both for comparison
        console.log('Handwriting text:', handwritingResult.typed_text);
        console.log('Mathpix LaTeX:', mathpixResult.latex);

        // Detect keywords and fetch links for the extracted text
        await detectKeywordsAndFetchLinks(finalLatex);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract LaTeX');
      console.error('Error extracting LaTeX:', err);
    } finally {
      setExtracting(null);
    }
  };

  const explainLatex = async (latexContent: string) => {
    setExplaining(true);
    setError(null);
    setExplanation(null);

    try {
      // Send to Gemini worker for explanation
      const response = await fetch('https://math-wizards-gemini.bascomisaiah.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mathContent: latexContent
        })
      });

      if (!response.ok) {
        throw new Error(`Explanation request failed: ${response.status}`);
      }

      const explanationText = await response.text();
      setExplanation(explanationText);
      console.log('Explanation generated successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate explanation');
      console.error('Error generating explanation:', err);
    } finally {
      setExplaining(false);
    }
  };

  const generateAudio = async (text: string) => {
    setGeneratingAudio(true);
    setError(null);

    try {
      // Clean the text for TTS (remove LaTeX commands if needed)
      const cleanText = text.replace(/[\\${}]/g, ' ').replace(/\s+/g, ' ').trim();

      console.log('Generating TTS for text:', cleanText);

      // Call TTS worker
      const response = await fetch('https://math-wizards-tts.bascomisaiah.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      // Get audio blob and create URL
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      // Clean up old audio URL if exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(url);
      console.log('Audio generated successfully');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      console.error('Error generating audio:', err);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  };

  // Handle audio time update for word highlighting
  const handleTimeUpdate = () => {
    if (!audioRef.current || !latex) return;

    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration;

    if (!duration) return;

    // Split text into words (simple split, ignoring LaTeX commands)
    const words = latex.replace(/[\\${}]/g, ' ').split(/\s+/).filter(w => w.trim());

    // Calculate which word should be highlighted based on time
    const wordIndex = Math.floor((currentTime / duration) * words.length);

    if (wordIndex !== currentWordIndex) {
      setCurrentWordIndex(wordIndex);
    }
  };

  // Effect to apply word highlighting when currentWordIndex changes
  useEffect(() => {
    if (!latexContainerRef.current || currentWordIndex < 0 || !latex) {
      return;
    }

    const container = latexContainerRef.current;

    // Remove previous highlights
    const previousHighlight = container.querySelector('.tts-highlight');
    if (previousHighlight) {
      previousHighlight.classList.remove('tts-highlight');
    }

    // In raw mode, highlight the specific word span
    if (viewMode === 'raw') {
      const wordSpan = container.querySelector(`[data-word-index="${currentWordIndex}"]`);
      if (wordSpan) {
        wordSpan.classList.add('tts-highlight');

        // Scroll to make highlighted word visible
        wordSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // In rendered mode, just auto-scroll based on progress
      const words = latex.replace(/[\\${}]/g, ' ').split(/\s+/).filter(w => w.trim());
      const scrollPercentage = words.length > 0 ? currentWordIndex / words.length : 0;
      const scrollTop = container.scrollHeight * scrollPercentage;
      container.scrollTop = scrollTop;
    }

  }, [currentWordIndex, latex, viewMode]);

  // Helper function to crop image using canvas
  const cropImage = async (
    dataUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw the cropped portion
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        // Convert to base64
        const croppedDataUrl = canvas.toDataURL('image/png');
        const base64 = croppedDataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  // Detect keywords and fetch links
  const detectKeywordsAndFetchLinks = async (text: string) => {
    setDetectingKeywords(true);
    setFetchingLinks(true);
    setError(null);
    setKeywords([]);

    try {
      console.log('Detecting keywords and fetching links for text:', text.substring(0, 100) + '...');

      // Call keyword-links worker (your new worker at localhost:8787)
      const response = await fetch('http://localhost:8787/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          keywords: [
            // Extract potential math keywords from the text
            // For now, we'll detect common STEM keywords automatically
            { text: 'continuity', field: 'analysis' },
            { text: 'limit', field: 'analysis' },
            { text: 'topology', field: 'topology' },
            { text: 'epsilon', field: 'analysis' },
            { text: 'delta', field: 'analysis' },
            { text: 'function', field: 'analysis' },
            { text: 'derivative', field: 'calculus' },
            { text: 'integral', field: 'calculus' },
            { text: 'theorem', field: 'mathematics' },
            { text: 'proof', field: 'mathematics' }
          ],
          maxLinksPerKeyword: 3,
          minRelevanceScore: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Keyword detection failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Keywords and links detected:', data);

      if (data.success && data.results) {
        // Filter out keywords that weren't found in the text
        const foundKeywords = data.results.filter((r: KeywordResult) => r.highlights.length > 0);
        setKeywords(foundKeywords);
      }

    } catch (err) {
      console.error('Error detecting keywords:', err);
      // Don't set error state - just fail silently for now
    } finally {
      setDetectingKeywords(false);
      setFetchingLinks(false);
    }
  };

  useEffect(() => {
    // Automatically scan when sidebar opens
    scanForPDFs();
  }, []);

  // Render LaTeX with KaTeX when latex content changes or keywords change
  useEffect(() => {
    if (latex && latexContainerRef.current) {
      // Clear previous content
      latexContainerRef.current.innerHTML = '';

      if (viewMode === 'raw') {
        // Show formatted raw LaTeX with word wrapping for TTS highlighting
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.overflowWrap = 'break-word';
        pre.style.fontFamily = 'monospace';
        pre.style.fontSize = '13px';
        pre.style.lineHeight = '1.6';

        // Split into words and wrap each in a span for highlighting
        const words = latex.split(/(\s+)/); // Keep whitespace
        words.forEach((word, index) => {
          const span = document.createElement('span');
          span.textContent = word;
          span.setAttribute('data-word-index', Math.floor(index / 2).toString());
          pre.appendChild(span);
        });

        latexContainerRef.current.appendChild(pre);
      } else {
        // Check if latex has delimiters
        const hasDelimiters = /\\\(|\\\)|\\\[|\\\]|\$\$|\$/.test(latex);

        if (!hasDelimiters) {
          // No delimiters - treat entire content as display math
          // This handles raw LaTeX like \begin{array}...\end{array}
          try {
            // Import katex for direct rendering
            import('katex').then((katex) => {
              if (latexContainerRef.current) {
                katex.default.render(latex, latexContainerRef.current, {
                  displayMode: true,
                  throwOnError: false,
                  errorColor: '#cc0000',
                  strict: false,
                  trust: false
                });
              }
            });
          } catch (err) {
            console.error('KaTeX render error:', err);
            latexContainerRef.current.textContent = latex;
          }
        } else {
          // Has delimiters - use auto-render for mixed text and math
          latexContainerRef.current.textContent = latex;

          try {
            renderMathInElement(latexContainerRef.current, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '\\[', right: '\\]', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false}
              ],
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false,
              trust: false
            });
          } catch (err) {
            console.error('KaTeX auto-render error:', err);
          }
        }
      }
    }
  }, [latex, viewMode]);

  // Highlight keywords in the rendered LaTeX text
  useEffect(() => {
    if (!latex || !latexContainerRef.current || keywords.length === 0) {
      return;
    }

    // Wait a bit for KaTeX to finish rendering
    const timer = setTimeout(() => {
      const container = latexContainerRef.current;
      if (!container) return;

      // Function to highlight keywords in text nodes
      const highlightInNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          let newHTML = text;
          let hasMatch = false;

          // Sort keywords by length (longest first) to avoid partial matches
          const sortedKeywords = [...keywords].sort((a, b) => b.keyword.length - a.keyword.length);

          sortedKeywords.forEach((kwResult) => {
            const keyword = kwResult.keyword;
            const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');

            if (regex.test(text)) {
              hasMatch = true;
              newHTML = newHTML.replace(regex, (match) => {
                return `<span class="keyword-highlight" data-keyword="${encodeURIComponent(JSON.stringify(kwResult))}">${match}</span>`;
              });
            }
          });

          if (hasMatch && node.parentNode) {
            const wrapper = document.createElement('span');
            wrapper.innerHTML = newHTML;
            node.parentNode.replaceChild(wrapper, node);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Skip KaTeX elements and already highlighted elements
          const element = node as HTMLElement;
          if (!element.classList.contains('katex') &&
              !element.classList.contains('keyword-highlight')) {
            Array.from(node.childNodes).forEach(highlightInNode);
          }
        }
      };

      highlightInNode(container);

      // Add hover event listeners to highlighted keywords
      const highlights = container.querySelectorAll('.keyword-highlight');
      highlights.forEach((highlight) => {
        highlight.addEventListener('mouseenter', handleKeywordHover);
        highlight.addEventListener('mouseleave', handleKeywordMouseLeave);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [keywords, latex, viewMode]);

  // Handle keyword hover to show popup
  const handleKeywordHover = (event: Event) => {
    const target = event.target as HTMLElement;
    const kwDataStr = target.getAttribute('data-keyword');

    if (!kwDataStr) return;

    try {
      const kwResult: KeywordResult = JSON.parse(decodeURIComponent(kwDataStr));

      // Create popup
      const popup = document.createElement('div');
      popup.className = 'keyword-popup';
      popup.style.position = 'fixed';
      popup.style.zIndex = '10000';

      // Build popup content
      let popupHTML = `
        <div class="keyword-popup-header">
          <strong>${kwResult.keyword}</strong>
          ${kwResult.field ? `<span class="field-badge">${kwResult.field}</span>` : ''}
        </div>
      `;

      if (kwResult.links.length > 0) {
        popupHTML += '<div class="keyword-popup-links">';
        kwResult.links.forEach((link, index) => {
          popupHTML += `
            <div class="popup-link-item">
              <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                ${index + 1}. ${link.title}
              </a>
              <span class="popup-relevance">${Math.round(link.relevanceScore * 100)}%</span>
              <div class="popup-domain">${link.displayLink}</div>
            </div>
          `;
        });
        popupHTML += '</div>';
      } else {
        popupHTML += '<div class="no-links-popup">No links available</div>';
      }

      popup.innerHTML = popupHTML;

      // Position popup near the keyword
      const rect = target.getBoundingClientRect();
      popup.style.left = `${rect.left}px`;
      popup.style.top = `${rect.bottom + 5}px`;

      // Add to body
      document.body.appendChild(popup);

      // Store reference for cleanup
      target.setAttribute('data-popup-id', 'active');
      (target as any)._popup = popup;

    } catch (err) {
      console.error('Error showing keyword popup:', err);
    }
  };

  const handleKeywordMouseLeave = (event: Event) => {
    const target = event.target as HTMLElement;
    const popup = (target as any)._popup;

    if (popup && popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }

    target.removeAttribute('data-popup-id');
    delete (target as any)._popup;
  };

  // Render markdown and LaTeX in explanation when it changes
  useEffect(() => {
    if (explanation && explanationContainerRef.current) {
      // Clear previous content
      explanationContainerRef.current.innerHTML = '';

      try {
        // First, parse markdown to HTML
        const htmlContent = marked.parse(explanation) as string;
        explanationContainerRef.current.innerHTML = htmlContent;

        // Then render any LaTeX delimiters in the parsed HTML
        renderMathInElement(explanationContainerRef.current, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '\\[', right: '\\]', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false}
          ],
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
          trust: false
        });
      } catch (err) {
        console.error('Markdown/LaTeX explanation render error:', err);
        // Fallback to plain text
        explanationContainerRef.current.textContent = explanation;
      }
    }
  }, [explanation]);


  return (
    <div className="sidepanel">
      <header className="header">
        <h1>Math Wizards</h1>
        <p className="subtitle">STEM Content Assistant</p>
      </header>

      <div className="content">
        <button
          onClick={scanForPDFs}
          disabled={scanning}
          className="scan-button"
        >
          {scanning ? 'Scanning...' : 'Scan Page for PDFs'}
        </button>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {pdfs.length > 0 && (
          <div className="pdf-list">
            <h2>Found {pdfs.length} Document{pdfs.length !== 1 ? 's' : ''}</h2>
            {pdfs.map((pdf, index) => (
              <div key={index} className="pdf-item">
                <div className="pdf-type">{pdf.type.toUpperCase()}</div>
                <a
                  href={pdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdf-link"
                >
                  {pdf.text || pdf.url}
                </a>
                {pdf.type === 'viewer' && (
                  <div className="viewer-note">
                    Image-based viewer detected. OCR can extract text from visible pages.
                  </div>
                )}
                {pdf.images && pdf.images.length > 0 && (
                  <div className="image-preview">
                    <small>{pdf.images.length} page image(s) found</small>
                  </div>
                )}
                <button
                  onClick={() => extractLatexFromPage(index)}
                  disabled={extracting !== null}
                  className="extract-button"
                >
                  {extracting === index ? 'Extracting...' : 'Extract LaTeX from Visible Page'}
                </button>
              </div>
            ))}
          </div>
        )}

        {latex && (
          <div className="latex-result">
            <div className="latex-header">
              <h3>Extracted Math</h3>
              <button
                onClick={() => setViewMode(viewMode === 'rendered' ? 'raw' : 'rendered')}
                className="view-toggle"
                title="Toggle between rendered math and raw LaTeX code"
              >
                {viewMode === 'rendered' ? '📝 View Raw' : '✨ View Rendered'}
              </button>
            </div>
            <div className="latex-content" ref={latexContainerRef}>
              {/* LaTeX will be rendered here by KaTeX */}
            </div>
            <div className="ocr-note">
              💡 Two-stage OCR: Handwriting recognition → Mathpix refinement for highest accuracy
            </div>
            <div className="latex-actions">
              <button
                onClick={() => navigator.clipboard.writeText(latex)}
                className="copy-button"
                title="Copy the raw LaTeX code to paste into LaTeX editors, Overleaf, or documents"
              >
                📋 Copy Raw LaTeX
              </button>
              <button
                onClick={() => explainLatex(latex)}
                disabled={explaining}
                className="explain-button"
              >
                {explaining ? 'Explaining...' : '🤖 Explain This Math'}
              </button>

              {/* TTS Controls */}
              <div className="tts-container">
                <button
                  onClick={() => setTtsDropdownOpen(!ttsDropdownOpen)}
                  className="tts-icon-button"
                  title="Text-to-Speech"
                >
                  🔊
                </button>

                {ttsDropdownOpen && (
                  <div className="tts-dropdown">
                    {!audioUrl ? (
                      <button
                        onClick={() => generateAudio(latex)}
                        disabled={generatingAudio}
                        className="tts-generate-button"
                      >
                        {generatingAudio ? 'Generating...' : 'Generate Audio'}
                      </button>
                    ) : (
                      <div className="tts-controls">
                        <button
                          onClick={playAudio}
                          disabled={isPlaying}
                          className="tts-play-button"
                          title="Play"
                        >
                          ▶️ Play
                        </button>
                        <button
                          onClick={pauseAudio}
                          disabled={!isPlaying}
                          className="tts-pause-button"
                          title="Pause"
                        >
                          ⏸️ Pause
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Hidden audio element */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
              />
            )}
          </div>
        )}

        {explanation && (
          <div className="explanation-result">
            <h3>AI Explanation</h3>
            <div className="explanation-content" ref={explanationContainerRef}>
              {/* Explanation with rendered LaTeX will appear here */}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(explanation)}
              className="copy-button"
            >
              Copy Explanation
            </button>
          </div>
        )}

        {/* Keywords detected but displayed inline in LaTeX text */}
        {detectingKeywords && (
          <div className="keywords-loading">
            <p>🔍 Detecting keywords and fetching relevant links...</p>
          </div>
        )}

        {!scanning && pdfs.length === 0 && !error && (
          <div className="empty-state">
            <p>No PDFs found on this page</p>
            <p className="hint">Click the button above to scan again</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel;