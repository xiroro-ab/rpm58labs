import xmlbuilder2 from 'xmlbuilder2';
try {
  const frag = xmlbuilder2.fragment({ namespaceAlias: { w: "@w" } });
  frag.ele('@w', "");
} catch (e) {
  console.log(e.message);
}
