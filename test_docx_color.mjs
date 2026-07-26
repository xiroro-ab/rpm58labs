import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<p style="color: inherit;">Test</p>`;
    await HTMLtoDOCX(html);
    console.log('Success color inherit!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
