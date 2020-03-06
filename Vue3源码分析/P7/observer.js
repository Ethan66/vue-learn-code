var ARRAY_METHODS = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse']
var array_methods = Object.create(Array.prototype)
ARRAY_METHODS.forEach(method => {
  array_methods[method] = function () {
    console.log('调用的是拦截的' + method + '方法');
    [...arguments].forEach(item => reactify(item))
    let res = Array.prototype[method].apply(this, arguments)
    return res
  }
})
var arr = []
arr.__proto__ = array_methods

function defineReactive (target, key, value, enumarable) {
  if (value.constructor === Object) {
    reactify(value)
  }
  Object.defineProperty(target, key, {
    configurable: false,
    enumerable: !!enumarable,
    get () {
      console.log('get: ', value)
      return value
    },
    set (newVal) {
      console.log('set: ', value)
      value = newVal
      vm.mount()
    }
  })
}

function reactify (o) {
  Object.keys(o).forEach(key => {
    let value = o[key]
    if (Array.isArray(value)) {
      value.__proto__ = array_methods
      value.forEach(sub => {
        reactify(sub)
      })
    } else {
      defineReactive(o, key, value, true)
    }
  })
}

var o = {
  name: 'Ethan',
  person: [{ name: 'person1', age: '2' }, { name: 'person2', age: '3' }],
  info: { name: 'per', age: '5' }
}
reactify(o)
