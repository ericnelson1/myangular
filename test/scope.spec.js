'use strict';

var Scope = require('../src/scope');

describe('Scope', function(){
  it('can be constructed and used as an object', function() {
    var scope = new Scope();
    scope.aproperty = 1;

    expect(scope.aproperty).toBe(1);
  });
});



