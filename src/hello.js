
var _ = require('lodash');

function sayHello(to) {
  return _.template('hello <%= name %>')({name: to});
}

module.exports =  {
  sayHello: sayHello
};

