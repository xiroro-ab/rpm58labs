import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<div style="border-bottom: 3px double #000;">Test</div>`;
    await HTMLtoDOCX(html);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
