function foo() {}
foo.prototype.foo_prop = 'foo val';

function bar() {}
bar.prototype.bar_prop = 'bar val';

var base = new foo();
base.xxx_prop = 'xxx val';

bar.prototype = base;

var wrapper = new bar();
wrapper.xxx_prop = 'CHANGED';

console.log(wrapper.foo_prop);
console.log(wrapper.bar_prop);
console.log(wrapper.xxx_prop);
console.log(base.xxx_prop);

