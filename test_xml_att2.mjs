import xmlbuilder2 from 'xmlbuilder2';

try {
  xmlbuilder2.create({root:{}}).first().att('@w', 'val', 'clear');
  console.log("Success 1");
} catch(e) {
  console.log("Error 1:", e.message);
}

try {
  xmlbuilder2.create({root:{}}).first().att('w:val', 'clear');
  console.log("Success 2");
} catch(e) {
  console.log("Error 2:", e.message);
}

