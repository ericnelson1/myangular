'use strict';

var setupModuleLoader = require('../src/loader');

describe('setupModuleLoader', function() {

  beforeEach(function() {
    delete window.angular;
  });

  it('exposes angular on the window', function() {
    setupModuleLoader(window);
    expect(window.angular).toBeDefined();
  });

  it('creates angular just once', function() {
    setupModuleLoader(window);
    var ng = window.angular;
    setupModuleLoader(window);
    expect(window.angular).toBe(ng);
  });

  it('exposes the angular module function', function() {
    setupModuleLoader(window);
    expect(window.angular.module).toBeDefined();
  });

  it('exposes the angular module function just once', function() {
    setupModuleLoader(window);
    var module = window.angular.module;
    setupModuleLoader(window);
    expect(window.angular.module).toBe(module);
  });

  describe('modules', function() {
    beforeEach(function() {
      setupModuleLoader(window);
    });

    it('allows registering a module', function() {
      var myModule = window.angular.module('myModule', []);
      expect(myModule).toBeDefined();
      expect(myModule.name).toBe('myModule')  ;
    });

    it('replaces a module when registering with same name', function() {
      var myModule = window.angular.module('myModule', []);
      var myNewModule = window.angular.module('myModule', []);
      expect(myModule).not.toBe(myNewModule);
    });

    it('attaches requires array to registered module', function() {
      var myModule = window.angular.module('myModule', ['myOtherModule']);
      expect(myModule.requires).toEqual(['myOtherModule']);
    });

    it('allows getting a module', function() {
      var myModule = window.angular.module('myModule', []);
      var gotModule = window.angular.module('myModule');
      expect(gotModule).toBeDefined();
      expect(gotModule).toBe(myModule);
    });

    it('throws when getting non-existent module', function() {
      expect(function() {
        window.angular.module('myModule');
      }).toThrow();
    });

    it('does not allow module named hasOwnPropery', function() {
      expect(function() {
        window.angular.module('hasOwnProperty', []);
      }).toThrow();
    });


  });


});