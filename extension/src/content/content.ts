// Content script that runs on all pages to scan for PDFs

interface PDFInfo {
  url: string;
  type: 'embed' | 'object' | 'iframe' | 'link';
  text?: string;
}

function scanForPDFs(): PDFInfo[] {
  const pdfs: PDFInfo[] = [];

  // 1. Check for <embed> tags with PDF sources
  const embeds = document.querySelectorAll('embed[type="application/pdf"], embed[src*=".pdf"]');
  embeds.forEach((embed) => {
    const src = embed.getAttribute('src');
    if (src) {
      pdfs.push({
        url: new URL(src, window.location.href).href,
        type: 'embed'
      });
    }
  });

  // 2. Check for <object> tags with PDF data
  const objects = document.querySelectorAll('object[type="application/pdf"], object[data*=".pdf"]');
  objects.forEach((obj) => {
    const data = obj.getAttribute('data');
    if (data) {
      pdfs.push({
        url: new URL(data, window.location.href).href,
        type: 'object'
      });
    }
  });

  // 3. Check for <iframe> tags with PDF sources
  const iframes = document.querySelectorAll('iframe[src*=".pdf"]');
  iframes.forEach((iframe) => {
    const src = iframe.getAttribute('src');
    if (src) {
      pdfs.push({
        url: new URL(src, window.location.href).href,
        type: 'iframe'
      });
    }
  });

  // 4. Check for <a> links pointing to PDFs
  const links = document.querySelectorAll('a[href*=".pdf"]');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      pdfs.push({
        url: new URL(href, window.location.href).href,
        type: 'link',
        text: link.textContent?.trim() || undefined
      });
    }
  });

  // Remove duplicates based on URL
  const uniquePdfs = Array.from(
    new Map(pdfs.map(pdf => [pdf.url, pdf])).values()
  );

  console.log(`Math Wizards: Found ${uniquePdfs.length} PDF(s) on page`);
  return uniquePdfs;
}

// Listen for messages from the sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanPDFs') {
    const pdfs = scanForPDFs();
    sendResponse({ pdfs });
  }
  return true; // Keep the message channel open for async response
});

// Auto-scan when page loads and log to console
window.addEventListener('load', () => {
  const pdfs = scanForPDFs();
  if (pdfs.length > 0) {
    console.log('Math Wizards: PDFs detected on this page:', pdfs);
  }
});
