'use strict';

var _ = require('lodash');

function Scope() {
  this.$$watchers = [];
};

Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn
  };
  this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function() {
  var self = this;
  var oldValue, newValue;
  _.forEach(this.$$watchers, function(watcher) {
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if (newValue !== oldValue) {
      watcher.last = newvalue;
      watcher.listenerFn(newValue, oldValue, self);
    }

    watcher.listenerFn();
  });
};




module.exports = Scope;
