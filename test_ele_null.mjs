import xmlbuilder2 from 'xmlbuilder2';
try {
  xmlbuilder2.create({root:{}}).first().ele('@w', null);
} catch (e) {
  console.log(e.stack);
}
