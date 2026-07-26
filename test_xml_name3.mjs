import xmlbuilder2 from 'xmlbuilder2';

try {
  xmlbuilder2.create({
    root: {
      '@@w': 'test'
    }
  }).end();
} catch(e) {
  console.log("Error:", e.message);
}
