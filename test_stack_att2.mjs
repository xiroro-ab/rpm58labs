import xmlbuilder2 from 'xmlbuilder2';
try {
  xmlbuilder2.create({root:{}}).first().att('@w', 'val', 'clear');
  console.log("Success");
} catch (e) {
  console.log(e.stack);
}
