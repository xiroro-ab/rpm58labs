import xmlbuilder2 from 'xmlbuilder2';
try {
  xmlbuilder2.create('root').ele('@w');
} catch (e) {
  console.log(e.message);
}
