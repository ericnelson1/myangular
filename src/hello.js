var _ = require('lodash');

function sayHello(to) {
  //return 'hello world';
  return _.template('hello <%= name %>')({name: to});
};

module.exports =  {
  sayHello: sayHello
};

