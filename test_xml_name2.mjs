import xmlbuilder2 from 'xmlbuilder2';

try {
  xmlbuilder2.create({
    root: {
      '@w': 'test'
    }
  }).end();
  console.log("Success with @w");
} catch(e) {
  console.log("Error 1:", e.message);
}

try {
  xmlbuilder2.create({
    root: {
      '@w ': 'test'
    }
  }).end();
  console.log("Success with '@w '");
} catch(e) {
  console.log("Error 2:", e.message);
}

try {
  xmlbuilder2.create({
    root: {
      '@w:val': 'test'
    }
  }).end();
  console.log("Success with @w:val");
} catch(e) {
  console.log("Error 3:", e.message);
}

