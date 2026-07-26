import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">Test</div>`;
    await HTMLtoDOCX(html);
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
