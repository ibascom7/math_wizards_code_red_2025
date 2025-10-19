// Content script that runs on all pages to scan for PDFs and document viewers

interface PDFInfo {
  url: string;
  type: 'embed' | 'object' | 'iframe' | 'link' | 'direct' | 'viewer';
  text?: string;
  images?: string[]; // For image-based viewers like Google Books
}

function scanForPDFs(): PDFInfo[] {
  const pdfs: PDFInfo[] = [];

  // 0. MOST IMPORTANT: Check if the current page IS a PDF being viewed directly
  // Chrome's PDF viewer has a special URL structure or content-type
  const currentUrl = window.location.href;
  const isPdfUrl = currentUrl.toLowerCase().endsWith('.pdf') ||
                   currentUrl.includes('.pdf?') ||
                   currentUrl.includes('.pdf#');

  // Check if we're in Chrome's PDF viewer by looking for the PDF viewer elements
  const isPdfViewer = document.querySelector('embed[type="application/pdf"]') !== null &&
                      document.body.childElementCount === 1;

  if (isPdfUrl || isPdfViewer) {
    pdfs.push({
      url: currentUrl,
      type: 'direct',
      text: 'Current PDF Document'
    });
    console.log('Math Wizards: Current page is a PDF:', currentUrl);
    return pdfs; // Return early since the whole page is a PDF
  }

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
  // This includes Canvas PDF viewers and other embedded PDFs
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    const src = iframe.getAttribute('src');
    if (src) {
      // Check if the iframe src contains .pdf or is a Canvas preview URL
      const isPdfUrl = src.includes('.pdf') ||
                       src.includes('/preview') ||
                       src.includes('canvas') && src.includes('files');

      // Also check the iframe's data attributes that Canvas might use
      const dataSrc = iframe.getAttribute('data-src');

      if (isPdfUrl) {
        pdfs.push({
          url: new URL(src, window.location.href).href,
          type: 'iframe',
          text: iframe.getAttribute('title') || undefined
        });
      } else if (dataSrc && dataSrc.includes('.pdf')) {
        pdfs.push({
          url: new URL(dataSrc, window.location.href).href,
          type: 'iframe',
          text: iframe.getAttribute('title') || undefined
        });
      }
    }
  });

  // 4. Check for <a> links pointing to PDFs
  const links = document.querySelectorAll('a[href*=".pdf"], a[href*="/preview"], a[href*="canvas"][href*="files"]');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      // Only include if it looks like a PDF or Canvas file
      const isPdfLink = href.includes('.pdf') ||
                        (href.includes('/preview') && link.textContent?.toLowerCase().includes('pdf')) ||
                        (href.includes('canvas') && href.includes('files'));

      if (isPdfLink) {
        pdfs.push({
          url: new URL(href, window.location.href).href,
          type: 'link',
          text: link.textContent?.trim() || link.getAttribute('title') || undefined
        });
      }
    }
  });

  // 5. Canvas-specific: Check for file preview containers
  // Canvas often uses specific classes for file attachments
  const canvasFileLinks = document.querySelectorAll(
    '.instructure_file_link, .instructure_scribd_file, .file-preview, [class*="canvas"][class*="file"]'
  );
  canvasFileLinks.forEach((element) => {
    const link = element.querySelector('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href && (href.includes('.pdf') || href.includes('/preview') || href.includes('/files/'))) {
        pdfs.push({
          url: new URL(href, window.location.href).href,
          type: 'link',
          text: link.textContent?.trim() || element.textContent?.trim() || 'Canvas File'
        });
      }
    }
  });

  // 6. Google Books viewer detection
  // Google Books uses canvas/image elements to render pages
  if (window.location.hostname.includes('books.google.com')) {
    const bookImages = document.querySelectorAll('img[src*="books.google.com"]');
    const canvasElements = document.querySelectorAll('canvas');

    if (bookImages.length > 0 || canvasElements.length > 0) {
      const imageUrls: string[] = [];

      // Collect image URLs from img tags
      bookImages.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && !src.includes('logo') && !src.includes('icon')) {
          imageUrls.push(src);
        }
      });

      pdfs.push({
        url: window.location.href,
        type: 'viewer',
        text: `Google Books (${imageUrls.length > 0 ? imageUrls.length : canvasElements.length} pages detected)`,
        images: imageUrls.length > 0 ? imageUrls.slice(0, 5) : undefined // First 5 images
      });
    }
  }

  // 6b. Canvas LMS viewer detection
  // Canvas uses various viewers including Crocodoc, Canvadoc, native viewers, and iframes
  if (window.location.hostname.includes('instructure.com') ||
      window.location.hostname.includes('canvas') ||
      document.querySelector('.instructure_file_link_holder, .file_preview_link')) {

    // MOST IMPORTANT: Check for Canvadoc iframe (Canvas's primary document viewer)
    const canvadocIframe = document.querySelector('iframe[src*="canvadoc_session"], iframe[src*="/api/v1/canvadoc"]');
    if (canvadocIframe) {
      const iframeSrc = canvadocIframe.getAttribute('src');

      // Try to extract attachment_id from the iframe src blob
      let attachmentInfo = '';
      if (iframeSrc && iframeSrc.includes('attachment_id')) {
        const match = iframeSrc.match(/attachment_id["%3A:]+(\d+)/);
        if (match) {
          attachmentInfo = ` (Attachment ID: ${match[1]})`;
        }
      }

      pdfs.push({
        url: window.location.href,
        type: 'viewer',
        text: `Canvas Canvadoc Viewer${attachmentInfo}`
      });
    }

    // Check for Crocodoc viewer (Canvas's older document viewer)
    const crocodocViewer = document.querySelector('.crocodoc-viewer, [class*="crocodoc"]');
    if (crocodocViewer) {
      const pageImages = crocodocViewer.querySelectorAll('img, canvas');
      const imageUrls: string[] = [];

      pageImages.forEach((elem) => {
        if (elem.tagName === 'IMG') {
          const src = (elem as HTMLImageElement).getAttribute('src');
          if (src && !src.includes('logo') && !src.includes('icon')) {
            imageUrls.push(src);
          }
        }
      });

      pdfs.push({
        url: window.location.href,
        type: 'viewer',
        text: `Canvas Crocodoc Viewer (${pageImages.length} page elements detected)`,
        images: imageUrls.length > 0 ? imageUrls.slice(0, 5) : undefined
      });
    }

    // Check for Canvas native PDF viewer
    const canvasPdfViewer = document.querySelector('[class*="PdfViewer"], [class*="pdf-viewer"]');
    if (canvasPdfViewer) {
      const pageImages = canvasPdfViewer.querySelectorAll('img[src*="preview"], canvas');
      const imageUrls: string[] = [];

      pageImages.forEach((elem) => {
        if (elem.tagName === 'IMG') {
          const src = (elem as HTMLImageElement).getAttribute('src');
          if (src) {
            imageUrls.push(src);
          }
        }
      });

      pdfs.push({
        url: window.location.href,
        type: 'viewer',
        text: `Canvas PDF Viewer (${pageImages.length} page elements detected)`,
        images: imageUrls.length > 0 ? imageUrls.slice(0, 5) : undefined
      });
    }

    // Check for generic Canvas document pages with images
    const docPages = document.querySelectorAll('[class*="document-page"], [class*="page-image"]');
    if (docPages.length > 0) {
      const imageUrls: string[] = [];

      docPages.forEach((page) => {
        const img = page.querySelector('img');
        if (img) {
          const src = img.getAttribute('src');
          if (src) {
            imageUrls.push(src);
          }
        }
      });

      if (imageUrls.length > 0) {
        pdfs.push({
          url: window.location.href,
          type: 'viewer',
          text: `Canvas Document (${docPages.length} pages detected)`,
          images: imageUrls.slice(0, 5)
        });
      }
    }

    // Also check for any iframe with Canvas file URLs
    const canvasFileIframes = document.querySelectorAll('iframe[src*="/files/"], iframe[src*="/courses/"][src*="/preview"]');
    canvasFileIframes.forEach((iframe) => {
      const src = iframe.getAttribute('src');
      if (src && !src.includes('canvadoc')) { // Don't duplicate canvadoc detection
        pdfs.push({
          url: new URL(src, window.location.href).href,
          type: 'iframe',
          text: 'Canvas File Viewer'
        });
      }
    });
  }

  // 7. Microsoft Teams viewer detection
  // Teams uses Office Online viewer and native viewers for documents
  if (window.location.hostname.includes('teams.microsoft.com') ||
      window.location.hostname.includes('teams.live.com') ||
      window.location.hostname.includes('sharepoint.com')) {

    // Check for Teams file viewer
    const teamsFileViewer = document.querySelector('[class*="file-viewer"], [class*="document-viewer"], [class*="pdf-viewer"]');
    if (teamsFileViewer) {
      const pageImages = teamsFileViewer.querySelectorAll('img[src*="thumbnail"], img[src*="preview"], canvas');
      const imageUrls: string[] = [];

      pageImages.forEach((elem) => {
        if (elem.tagName === 'IMG') {
          const src = (elem as HTMLImageElement).getAttribute('src');
          if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
            imageUrls.push(src);
          }
        }
      });

      pdfs.push({
        url: window.location.href,
        type: 'viewer',
        text: `Teams Document Viewer (${pageImages.length} page elements detected)`,
        images: imageUrls.length > 0 ? imageUrls.slice(0, 5) : undefined
      });
    }

    // Check for Office Online viewer (Word Online, PowerPoint Online, PDF viewer)
    const officeViewer = document.querySelector('[class*="Office"], [class*="WACViewPanel"], [id*="WebApplicationFrame"]');
    if (officeViewer) {
      const pageImages = officeViewer.querySelectorAll('img, canvas');
      const imageUrls: string[] = [];

      pageImages.forEach((elem) => {
        if (elem.tagName === 'IMG') {
          const src = (elem as HTMLImageElement).getAttribute('src');
          if (src && (src.includes('thumbnail') || src.includes('preview') || src.includes('.pdf'))) {
            imageUrls.push(src);
          }
        }
      });

      if (pageImages.length > 0) {
        pdfs.push({
          url: window.location.href,
          type: 'viewer',
          text: `Office Online Viewer (${pageImages.length} page elements detected)`,
          images: imageUrls.length > 0 ? imageUrls.slice(0, 5) : undefined
        });
      }
    }

    // Check for SharePoint document library previews
    const sharePointPreview = document.querySelector('[class*="PreviewPane"], [class*="FilePreview"]');
    if (sharePointPreview) {
      const pageImages = sharePointPreview.querySelectorAll('img, canvas');
      const imageUrls: string[] = [];

      pageImages.forEach((elem) => {
        if (elem.tagName === 'IMG') {
          const src = (elem as HTMLImageElement).getAttribute('src');
          if (src && !src.includes('icon')) {
            imageUrls.push(src);
          }
        }
      });

      if (pageImages.length > 0) {
        pdfs.push({
          url: window.location.href,
          type: 'viewer',
          text: `SharePoint Preview (${pageImages.length} page elements detected)`,
          images: imageUrls.length > 0 ? imageUrls.slice(0, 5) : undefined
        });
      }
    }

    // Look for PDF download/view links in Teams messages
    const teamsPdfLinks = document.querySelectorAll('a[href*=".pdf"], a[href*="viewer.aspx"]');
    teamsPdfLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.includes('.pdf')) {
        pdfs.push({
          url: new URL(href, window.location.href).href,
          type: 'link',
          text: link.textContent?.trim() || 'Teams PDF Attachment'
        });
      }
    });
  }

  // 8. ArXiv and similar academic paper sites
  // Check for their specific PDF viewer patterns
  if (window.location.hostname.includes('arxiv.org')) {
    // ArXiv has direct PDF links in specific places
    const pdfLinks = document.querySelectorAll('a[href*="/pdf/"]');
    pdfLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        pdfs.push({
          url: new URL(href, window.location.href).href,
          type: 'link',
          text: 'ArXiv PDF'
        });
      }
    });
  }

  // Remove duplicates based on URL
  const uniquePdfs = Array.from(
    new Map(pdfs.map(pdf => [pdf.url, pdf])).values()
  );

  console.log(`Math Wizards: Found ${uniquePdfs.length} PDF(s) on page`);
  return uniquePdfs;
}

// Listen for messages from the sidebar
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
