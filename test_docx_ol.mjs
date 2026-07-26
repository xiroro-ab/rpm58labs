import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<ol type="A"><li>Test</li></ol>`;
    await HTMLtoDOCX(html);
    console.log('Success ol!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
