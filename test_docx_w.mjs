import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<p @w="1">Test</p>`;
    const buffer = await HTMLtoDOCX(html);
    console.log('Success!', buffer.length);
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
