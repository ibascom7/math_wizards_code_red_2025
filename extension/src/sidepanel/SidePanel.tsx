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

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Capture screenshot of the visible tab
      const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png'
      });

      // Convert data URL to blob
      const response = await fetch(screenshotUrl);
      const blob = await response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64Image = await base64Promise;

      // Send to Cloudflare Worker /ocr endpoint
      console.log('Screenshot captured, base64 length:', base64Image.length);

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
            <button
              onClick={() => navigator.clipboard.writeText(latex)}
              className="copy-button"
            >
              Copy to Clipboard
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