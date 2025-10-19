import React, { useState, useEffect } from 'react';

interface PDFInfo {
  url: string;
  type: 'embed' | 'object' | 'iframe' | 'link' | 'direct' | 'viewer';
  text?: string;
  images?: string[];
}

const SidePanel: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<number | null>(null);
  const [latex, setLatex] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

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

      // Send to Cloudflare Worker /ocr endpoint
      const ocrResponse = await fetch('https://math-wizards-ocr.bascomisaiah.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image
        })
      });

      if (!ocrResponse.ok) {
        throw new Error(`OCR request failed: ${ocrResponse.status}`);
      }

      const result = await ocrResponse.json();
      setLatex(result.latex || 'No LaTeX detected');
      console.log('OCR result:', result);

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

  useEffect(() => {
    // Automatically scan when sidebar opens
    scanForPDFs();
  }, []);

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
            <h3>Extracted LaTeX</h3>
            <div className="latex-content">
              {latex}
            </div>
            <div className="latex-actions">
              <button
                onClick={() => navigator.clipboard.writeText(latex)}
                className="copy-button"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => explainLatex(latex)}
                disabled={explaining}
                className="explain-button"
              >
                {explaining ? 'Explaining...' : '🤖 Explain This Math'}
              </button>
            </div>
          </div>
        )}

        {explanation && (
          <div className="explanation-result">
            <h3>AI Explanation</h3>
            <div className="explanation-content">
              {explanation}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(explanation)}
              className="copy-button"
            >
              Copy Explanation
            </button>
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