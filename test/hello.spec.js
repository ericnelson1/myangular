var hello = require('../src/hello');

describe('Hello', function() {
  it('says hello', function () {
    expect(hello.sayHello('jane')).toBe('hello jane');
  });
});