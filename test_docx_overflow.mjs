import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<div style="overflow-x: auto;"><table><tr><td>Test</td></tr></table></div>`;
    await HTMLtoDOCX(html);
    console.log('Success overflow!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
