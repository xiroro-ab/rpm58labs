import xmlbuilder2 from 'xmlbuilder2';

try {
  xmlbuilder2.create({root:{}}).first().ele("@w", "pPr");
  console.log("Success");
} catch(e) {
  console.log("Error:", e.message);
}
