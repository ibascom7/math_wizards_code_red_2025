import React, { useState, useEffect } from 'react';

interface PDFInfo {
  url: string;
  type: 'embed' | 'object' | 'iframe' | 'link';
  text?: string;
}

const SidePanel: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanForPDFs = async () => {
    setScanning(true);
    setError(null);
    setPdfs([]);

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script to scan for PDFs
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanPDFs' });

      if (response.pdfs) {
        setPdfs(response.pdfs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan for PDFs');
      console.error('Error scanning for PDFs:', err);
    } finally {
      setScanning(false);
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
            <h2>Found {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}</h2>
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
              </div>
            ))}
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