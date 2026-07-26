import handler from './api/docx.ts';

const req = {
  method: 'POST',
  body: JSON.stringify({
    html: '<p>Hello <b>World</b>!</p>',
    filename: 'test.docx'
  })
};

const res = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log("JSON response:", data);
  },
  setHeader(k, v) {
    console.log("Header:", k, v);
  },
  send(buffer) {
    console.log("Success! Buffer size:", buffer.length);
  }
};

handler(req, res).catch(console.error);
