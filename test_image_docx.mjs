import HTMLtoDOCX from 'html-to-docx';

async function test() {
  try {
    const html = `<!DOCTYPE html><html><body><img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png"></body></html>`;
    console.log('Generating DOCX with image...');
    const buffer = await HTMLtoDOCX(html);
    console.log('Success, buffer length:', buffer.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
