import xmlbuilder2 from 'xmlbuilder2';

try {
  xmlbuilder2.create('root').att('@w', 'val', 'clear');
  console.log("Success");
} catch(e) {
  console.log("Error:", e.message);
}
