import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<p @w="1">Test</p>`;
    await HTMLtoDOCX(html);
    console.log('Success @w!');
  } catch(e) {
    console.error('Error @w:', e.message);
  }

  try {
    const html = `<p @w="1">Test</p>`;
    // actually, let's test if an attribute with @w:something throws
    await HTMLtoDOCX(`<p @w:val="1">Test</p>`);
    console.log('Success @w:val!');
  } catch(e) {
    console.error('Error @w:val:', e.message);
  }
}
test();
