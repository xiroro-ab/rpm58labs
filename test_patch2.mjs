import xmlbuilder2 from 'xmlbuilder2';
const Builder = xmlbuilder2.create({root:{}}).constructor;
const origEle = Builder.prototype.ele;
Builder.prototype.ele = function(p1, p2, p3) {
  if (p1 === '@w' && p2 === undefined) {
    console.log("Caught undefined element name for @w");
    return this; // Skip it! Return current node so builder doesn't crash on chaining.
  }
  return origEle.apply(this, arguments);
};

try {
  xmlbuilder2.create({root:{}}).first().ele('@w', undefined);
  console.log("Success patched ele!");
} catch (e) {
  console.log("Error:", e.stack);
}
