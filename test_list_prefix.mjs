import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<ol style="list-style-type: none;"><li>Test</li></ol>`;
    await HTMLtoDOCX(html);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
