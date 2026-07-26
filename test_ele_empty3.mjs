import xmlbuilder2 from 'xmlbuilder2';
try {
  const frag = xmlbuilder2.fragment({ namespaceAlias: { w: "@w" } });
  frag.ele('@w', "");
  console.log("Success!");
} catch (e) {
  console.log(e.message);
}
