import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<ul style="list-style-type: none; margin: 8px 0; padding-left: 0;"><li>Test</li></ul>`;
    await HTMLtoDOCX(html);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
