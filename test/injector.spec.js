'use strict';

var setupModuleLoader = require('../src/loader');
var createInjector = require('../src/injector');

describe('injector', function() {

  beforeEach(function() {
    delete window.angular;
    setupModuleLoader(window);
  });

  it('can be created', function() {
    var injector = createInjector([]);
    expect(injector).toBeDefined();
  });

  it('has a constant that has been registered to a module', function() {
    var module = window.angular.module('myModule', []);
    module.constant('aConstant', 42);
    var injector = createInjector(['myModule']);
    expect(injector.has('aConstant')).toBe(true);
  });

  it('does not have a non-registered constant', function() {
    var module = window.angular.module('myModule', []);
    var injector = createInjector(['myModule']);
    expect(injector.has('aConstant')).toBe(false);
  });

  it('does not allow a constant named hasOwnProperty', function() {
    var module = window.angular.module('myModule', []);
    module.constant('hasOwnProperty', false);
    expect(function() {
      createInjector(['myModule']);
    }).toThrow();
  });

  it('can return a registered constant', function() {
    var module = window.angular.module('myModule', []);
    module.constant('aConstant', 42);
    var injector = createInjector(['myModule']);
    expect(injector.get('aConstant')).toBe(42);
  });

  it('loads multiple modules', function() {
    var module1 = window.angular.module('myModule', []);
    var module2 = window.angular.module('myOtherModule', []);
    module1.constant('aConstant', 42);
    module2.constant('anotherConstant', 46);
    var injector = createInjector(['myModule', 'myOtherModule']);
    expect(injector.has('aConstant')).toBe(true);
    expect(injector.has('anotherConstant')).toBe(true);
  });

  it('loads the required modules of a module', function() {
    var module1 = window.angular.module('myModule', []);
    var module2 = window.angular.module('myOtherModule', ['myModule']);
    module1.constant('aConstant', 42);
    module2.constant('anotherConstant', 46);
    var injector = createInjector(['myOtherModule']);
    expect(injector.has('aConstant')).toBe(true);
    expect(injector.has('anotherConstant')).toBe(true);
  });

  it('loads each module only once', function() {
    // create circular reference
    window.angular.module('myModule', ['myOtherModule']);
    window.angular.module('myOtherModule', ['myModule']);
    // this should work ok
    createInjector(['myModule']);
  });

  it('invokes an annotated function with dependency injection', function() {
    var module = window.angular.module('myModule', []);
    module.constant('a', 1);
    module.constant('b', 2);
    var injector = createInjector(['myModule']);

    var fn = function(one, two) { return one + two; };
    fn.$inject = ['a', 'b'];
    expect(injector.invoke(fn)).toBe(3);
  });

  it('does not accept non-strings as injection tokens', function() {
    var module = window.angular.module('myModule', []);
    module.constant('a', 1);
    var injector = createInjector(['myModule']);

    var fn = function(one, two) { return one + two; };
    fn.$inject = ['a', 2]; // 2 is invalid
    expect(function() { injector.invoke(fn); }).toThrow();
  });

  it('invokes a function with the given this context', function() {
    var module = window.angular.module('myModule', []);
    module.constant('a', 1);
    var injector = createInjector(['myModule']);

    var obj = {
      two: 2,
      fn: function(one) { return one + this.two; }
    };

    obj.fn.$inject = ['a'];
    expect(injector.invoke(obj.fn, obj)).toBe(3);
  });

  it('overrides dependencies with locals', function() {
    var module = window.angular.module('myModule', []);
    module.constant('a', 1);
    module.constant('b', 2);
    var injector = createInjector(['myModule']);

    var fn = function(one, two) { return one + two; };
    fn.$inject = ['a', 'b']; 
    expect(injector.invoke(fn, undefined, {b:3})).toBe(4);
  });

  describe('annotate', function() {
    it('returns the $inject annotation of a function when it has one', function() {
      var injector = createInjector([]);
      var fn = function() {};
      fn.$inject = ['a','b'];
      expect(injector.annotate(fn)).toEqual(['a','b']);
    });

    it('returns array-style annotations of a function', function() {
      var injector = createInjector([]);
      var fn = ['a', 'b', function() {}];
      expect(injector.annotate(fn)).toEqual(['a','b']);
    });

    it('returns empty array for a non-annotated zero param function', function() {
      var injector = createInjector([]);
      var fn = function() {};
      expect(injector.annotate(fn)).toEqual([]);
    });

    it('returns annotations parsed from function args when not annotated', function() {
      var injector = createInjector([]);
      var fn = function(a, b) {};
      expect(injector.annotate(fn)).toEqual(['a', 'b']);
    });

    it('strips comments from arguments list', function() {
      var injector = createInjector([]);
      var fn = function(a, /* b, */ c) {};
      expect(injector.annotate(fn)).toEqual(['a', 'c']);
    });

    it('invokes an array-annotated function with di', function() {
      var module = window.angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);

      var fn = ['a', 'b', function(one, two) { return one + two; }];
      expect(injector.invoke(fn)).toBe(3);
    });

    it('instantiates an annotated constructor function', function() {
      var module = window.angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);

      function Type(one, two) {
        this.result = one + two;
      }
      Type.$inject = ['a', 'b'];

      var instance = injector.instantiate(Type);
      expect(instance.result).toBe(3);
    });

    it('instantiates an array-annotated constructor function', function() {
      var module = window.angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);

      function Type(one, two) {
        this.result = one + two;
      }

      var instance = injector.instantiate(['a', 'b', Type]);
      expect(instance.result).toBe(3);
    });

    it('instantiates a non-annotated constructor function', function() {
      var module = window.angular.module('myModule', []);
      module.constant('a', 1);
      module.constant('b', 2);
      var injector = createInjector(['myModule']);

      function Type(a, b) {
        this.result = a+b;
      }

      var instance = injector.instantiate(Type);
      expect(instance.result).toBe(3);
    });

  });


});






