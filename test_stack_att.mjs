import xmlbuilder2 from 'xmlbuilder2';
try {
  xmlbuilder2.create({root:{}}).first().att('@w', 'val');
} catch (e) {
  console.log(e.stack);
}
