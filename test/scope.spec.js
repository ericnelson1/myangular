'use strict';

var _ = require('lodash');
var Scope = require('../src/scope');

describe('Scope', function() {
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

    it('calls listener when watch value is first undefined', function () {
      scope.counter = 0;
      scope.$watch(
        function(scope) { return scope.somevalue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('calls listener with new value as old value first time', function() {
      scope.somevalue = 123;
      var oldValueGiven;
      scope.$watch(
        function(scope) { return scope.somevalue; },
        function(newValue, oldValue, scope) { oldValueGiven = oldValue; } 
      );
      scope.$digest();
      expect(oldValueGiven).toBe(123);
    });

    it('may have watchers that omit the listener function', function() {
      var watchFn = jasmine.createSpy().and.returnValue('something');
      scope.$watch(watchFn);
      scope.$digest();
      expect(watchFn).toHaveBeenCalled();
    });

    it('triggers chained watchers in the same digest', function() {
      scope.name = 'jane';

      scope.$watch(
        function(scope) { return scope.nameUpper; },
        function(newValue, oldValue, scope) {
          if (newValue)
            scope.initial = newValue.substring(0,1) + '.';
        }
      );

      scope.$watch(
        function(scope) { return scope.name; },
        function(newValue, oldValue, scope) {
          if (newValue)
            scope.nameUpper = newValue.toUpperCase();
        }
      );

      scope.$digest();
      expect(scope.initial).toBe('J.');

      scope.name = 'bob';
      scope.$digest();
      expect(scope.initial).toBe('B.');
    });

    it('gives up after 10 iterations', function() {
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch(
        function(scope) { return scope.counterA; },
        function(newValue, oldValue, scope) {
          scope.counterB++;
        });

      scope.$watch(
        function(scope) { return scope.counterB; },
        function(newValue, oldValue, scope) {
          scope.counterA++;
        });

      expect((function() { scope.$digest(); })).toThrow();
    });

    it('ends digest when last watch is clean', function() {
      scope.array = _.range(100);
      var watchExecutions = 0;

      _.times(100, function(i) {
        scope.$watch(
          function(scope) {
            watchExecutions++;
            return scope.array[i];
          },
          function(newValue, oldValue, scope) {}
        );
      });

      scope.$digest();
      expect(watchExecutions).toBe(200);

      scope.array[0] = 420;
      scope.$digest();
      expect(watchExecutions).toBe(301);
    });

    it('does not end digest so that new watches are not run', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.$watch(
            function(scope) { return scope.aValue; },
            function(newValue, oldValue, scope) {
              scope.counter++;
            }
          );
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('compares based on value if enabled', function() {
      scope.aValue = [1,2,3];
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue.push(4);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('correctly handles NaNs', function() {
      scope.number = 0/0;  // nan
      scope.counter= 0;

      scope.$watch(
        function(scope) { return scope.number; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('catches exceptions in watch functions and continues', function () {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { throw 'Error'; },
        function(newValue, oldValue, scope) { }
      );

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('catches exceptions in listener functions and continues', function () {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { throw 'Error'; }
      );

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('allows destroying a watch with a removal function', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      var destroy = scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
      destroy();
      scope.$digest();
      expect(scope.counter).toBe(1);

    });

    it('allows destroying a watch during a digest', function() {
      scope.aValue = 'abc';

      var watchCalls = [];

      scope.$watch(function(scope) { 
        watchCalls.push('first');
        return scope.aValue;
      });

      var destroy = scope.$watch(function(scope) {
        watchCalls.push('second');
        destroy();
      });      

      scope.$watch(function(scope) { 
        watchCalls.push('third');
        return scope.aValue;
      });

      scope.$digest();
      expect(watchCalls).toEqual(
        ['first', 'second', 'third', 'first', 'third']);
    });

    it('allows a watch to destroy another during a digest', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { destroy(); }
      );

      var destroy = scope.$watch(
        function(scope) { },
        function(newValue, oldValue, scope) { }
      );

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('allows destroying several watches during a digest', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      var destroy1 = scope.$watch(
        function(scope) { destroy1(); destroy2(); }
      );

      var destroy2 = scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(0);
    });

    it('has correct $phase value', function() {
      scope.watchPhase = undefined;
      scope.listenPhase = undefined;
      scope.applyPhase = undefined;

      scope.$watch(
        function(scope) {
          scope.watchPhase = scope.$$phase;
        },
        function (newValue, oldValue, scope) {
          scope.listenPhase = scope.$$phase;
        }
      );

      scope.$apply(function() {
        scope.applyPhase = scope.$$phase;
      });

      expect(scope.watchPhase).toBe('$digest');
      expect(scope.listenPhase).toBe('$digest');
      expect(scope.applyPhase).toBe('$apply');
    });
  });

  describe('$eval', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('executes evaled function and returns result', function() {
      scope.aValue = 12;
      var result = scope.$eval(function(scope) { return scope.aValue; });
      expect(result).toBe(12);
    });

    it('passes second argument through', function() {
      var result = scope.$eval(function(scope, arg) { return arg; }, 23);
      expect(result).toBe(23);
    });
  });

  describe('$apply', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('executes a function and starts digest', function() {
      scope.aValue = 'somevalue';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$apply(
        function(scope) { scope.aValue = 'anothervalue'; }
      );

      expect(scope.counter).toBe(2);
    });

  });

  describe('$evalAsync', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('execute function later within same digest cycle', function() {
      scope.aValue = 1;
      scope.evaluated = false;
      scope.evaluatedImmediately = false;
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { 
          scope.$evalAsync(function(scope) {
            scope.evaluated = true;
          });
          scope.evaluatedImmediately = scope.evaluated;
        }
      );

      scope.$digest();
      expect(scope.evaluated).toBe(true);
      expect(scope.evaluatedImmediately).toBe(false);
    });

    it('schedules digest in $evalAsync', function(done) {
      scope.aValue = 'somevalue';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$evalAsync(function(scope) {});
      expect(scope.counter).toBe(0);

      setTimeout(function() {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

    it('catches exceptions in $evalAsync', function(done) {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$evalAsync(function(scope) { throw 'Error'; });

      setTimeout(function() {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

  });

  describe('$applyAsync', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('allows async $apply with $applyAsync', function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      }); 
      expect(scope.counter).toBe(1);

      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it('never executes $applyAsync in same cycle', function(done) {
      scope.aValue = 123;
      scope.asyncApplied = false;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { 
          scope.$applyAsync(function(scope) {
            scope.asyncApplied = true;
          }); 
        }
      );

      scope.$digest();
      expect(scope.asyncApplied).toBe(false);

      setTimeout(function() {
        expect(scope.asyncApplied).toBe(true);
        done();
      }, 50);
    });

    it('coalesces many calls to $applyAsync', function (done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function() {}
      );

      scope.$applyAsync(function(scope) { scope.aValue = 'a';});
      scope.$applyAsync(function(scope) { scope.aValue = 'b';});

      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it('cancels and flushes $applyAsync if digested first', function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function() {}
      );

      scope.$applyAsync(function(scope) { scope.aValue = 'a';});
      scope.$applyAsync(function(scope) { scope.aValue = 'b';});

      scope.$digest();
      expect(scope.counter).toBe(2);
      expect(scope.aValue).toBe('b');

      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it('catches exceptions in $applyAsync', function(done) {
      scope.$applyAsync(function() { throw 'Error'; });
      scope.$applyAsync(function() { throw 'Error'; });
      scope.$applyAsync(function(scope) { scope.applied = true; });

      setTimeout(function() {
        expect(scope.applied).toBe(true);
        done();
      }, 50);
    });
  });

  describe('$$postDigest', function () {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('runs after each digest', function() {
      scope.counter = 0;
      scope.$$postDigest(function() {
        scope.counter++;
      });

      expect(scope.counter).toBe(0);
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('does not include $$postDigest in the digest', function() {
      scope.aValue = 'original';

      scope.$$postDigest(function() {
        scope.aValue = 'changed';
      });

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.watchedValue = newValue;
        }
      ); 

      scope.$digest();
      expect(scope.watchedValue).toBe('original');
      scope.$digest();
      expect(scope.watchedValue).toBe('changed');
    });

    it('catches exceptions in $$postDigest', function() {
      var ran = false;

      scope.$$postDigest(function() { throw 'Error'; });
      scope.$$postDigest(function() { ran = true; });

      scope.$digest();
      expect(ran).toBe(true);

    });
  });

});



