import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    let { html, filename, footerText } = body;
        if (html) {
      html = html.replace(/✓/g, '✅').replace(/✔/g, '✅');
      html = html.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Mindful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Meaningful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Joyful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span class="[^"]*"(?:[^>]*)>(Mindful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span class="[^"]*"(?:[^>]*)>(Meaningful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span class="[^"]*"(?:[^>]*)>(Joyful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/\b(Mindful(?:\s+\w+)?)\b/gi, '<span class="label-mindful">$1</span>');
      html = html.replace(/\b(Meaningful(?:\s+\w+)?)\b/gi, '<span class="label-meaningful">$1</span>');
      html = html.replace(/\b(Joyful(?:\s+\w+)?)\b/gi, '<span class="label-joyful">$1</span>');
    }
    if (!html) return res.status(400).json({ error: 'HTML is required' });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">\n          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Noto+Color+Emoji&family=Noto+Sans+Symbols&family=Noto+Sans+Symbols+2&display=swap" rel="stylesheet">
          
          <style>
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; font-family: 'Space Grotesk', 'Noto Color Emoji', 'Noto Sans Symbols', 'Noto Sans Symbols 2', 'Segoe UI Symbol', sans-serif; }
            table { page-break-inside: avoid; }
            tr, td, th { page-break-inside: avoid; }
            h1, h2, h3, h4, h5 { page-break-after: avoid; page-break-inside: avoid; }\n            table { page-break-inside: auto; }\n            tr { page-break-inside: avoid; page-break-after: auto; }
            img.emoji { height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em; }
          
            .label-mindful { background-color: #ef4444 !important; color: white !important; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 4px; display: inline-block; margin-bottom: 4px; }
            .label-meaningful { background-color: #eab308 !important; color: white !important; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 4px; display: inline-block; margin-bottom: 4px; }
            .label-joyful { background-color: #3b82f6 !important; color: white !important; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 4px; display: inline-block; margin-bottom: 4px; }
          </style>
        </head>
        <body>${html}</body>
      </html>`;

    // Important for Vercel: set the graphics mode and headless mode
    // sparticuz/chromium handles the path for AWS Lambda / Vercel Serverless automatically.
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: (chromium as any).headless,
      // @ts-ignore
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' as any });
        await page.evaluateHandle('document.fonts.ready');
    
    // Parse emojis to SVG
    await page.addScriptTag({ url: 'https://unpkg.com/twemoji@latest/dist/twemoji.min.js' });
    await page.evaluate(() => {
      if ((window as any).twemoji) (window as any).twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
    });
    // Wait for the SVG images from twemoji to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 8px; width: 100%; display: flex; justify-content: space-between; padding-left: 15mm; padding-right: 15mm; color: #666; font-family: sans-serif;"><span>${footerText || ''}</span><span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span></div>`
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'document.pdf'}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
}


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
