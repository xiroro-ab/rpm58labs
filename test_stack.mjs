import xmlbuilder2 from 'xmlbuilder2';
try {
  xmlbuilder2.create({root:{}}).first().ele('@w');
} catch (e) {
  console.log(e.stack);
}
