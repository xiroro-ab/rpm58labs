import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<p style="margin-top: 30px; margin-bottom: 20px; text-align: center; padding: 0 20px; page-break-inside: avoid;">Test</p>`;
    await HTMLtoDOCX(html);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
