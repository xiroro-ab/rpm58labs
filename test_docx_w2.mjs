import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<p style="@w: 1px;">Test</p>`;
    await HTMLtoDOCX(html);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
