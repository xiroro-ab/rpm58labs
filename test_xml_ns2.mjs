import xmlbuilder2 from 'xmlbuilder2';

try {
  const frag = xmlbuilder2.fragment({ namespaceAlias: { w: "@w" } });
  frag.ele("@w", "pPr");
  console.log("Success");
} catch(e) {
  console.log("Error:", e.message);
}
