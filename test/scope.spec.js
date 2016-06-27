'use strict';

var Scope = require('../src/scope');

describe('Scope', function(){
  it('can be constructed and used as an object', function() {
    var scope = new Scope();
    scope.aproperty = 1;

    expect(scope.aproperty).toBe(1);
  });

  describe('digest', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('calls the listener function of a watch on first digest', function() {
      // arrange
      var watchFn = function() { return 'wat'; };
      var listenerFn = jasmine.createSpy();
      scope.$watch(watchFn, listenerFn);
      // act
      scope.$digest();
      // assert
      expect(listenerFn).toHaveBeenCalled();
    });

    it('calls a watch function with the scope as an argument', function() {
      // arrange
      var watchFn = jasmine.createSpy();
      var listenerFn = function() {};
      scope.$watch(watchFn, listenerFn);
      // act
      scope.$digest();
      // assert
      expect(watchFn).toHaveBeenCalled();
    });

    it('calls the listener function when the watched value changes', function() {
      scope.somevalue = 'a';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.somevalue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      expect(scope.counter).toBe(0);
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.somevalue = 'b';
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(2);

    });

  });

});



