function foo() {}
foo.prototype.foo_prop = 'foo val';

function bar() {
    foo.call(this);
}
bar.prototype.bar_prop = 'bar val';

var wrapper = new bar();
wrapper.xxx_prop = 'CHANGED';

console.log(wrapper.foo_prop);
console.log(wrapper.bar_prop);
console.log(wrapper.xxx_prop);
