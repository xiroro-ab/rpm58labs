import xmlbuilder2 from 'xmlbuilder2';

try {
  xmlbuilder2.create({
    '@w': 'test'
  });
  console.log("Success with @w");
} catch(e) {
  console.log("Error 1:", e.message);
}

try {
  xmlbuilder2.create({
    '@w:something': 'test'
  });
  console.log("Success with @w:something");
} catch(e) {
  console.log("Error 2:", e.message);
}

