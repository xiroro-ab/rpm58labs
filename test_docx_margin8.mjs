import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<p style="margin: 8px 0;">Test</p>`;
    await HTMLtoDOCX(html);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
