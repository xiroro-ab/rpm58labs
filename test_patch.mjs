import xmlbuilder2 from 'xmlbuilder2';
const Builder = xmlbuilder2.create({root:{}}).constructor;
const origAtt = Builder.prototype.att;
Builder.prototype.att = function(p1, p2, p3) {
  if (p1 === '@w' && p3 === undefined) {
    console.log("Caught undefined attribute value for @w:", p2);
    return this; // Skip it!
  }
  return origAtt.apply(this, arguments);
};

try {
  xmlbuilder2.create({root:{}}).first().att('@w', 'val', undefined);
  console.log("Success patched att!");
} catch (e) {
  console.log("Error:", e.stack);
}
