import soalHandler from './_generate-manual-soal.js';
import tableHandler from './_generate-manual-table.js';

export default async function handler(req, res) {
  const type = req.query.type;
  
  if (type === 'soal') {
    return soalHandler(req, res);
  } else if (type === 'table') {
    return tableHandler(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid type parameter. Must be "soal" or "table".' });
  }
}
