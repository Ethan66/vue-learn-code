class Observer {
  constructor (data) {
    this.observer(data)
  }
  observer (data) {
    // { person: { name: '张三', fav: { a: '爱好'} } }
    if (data && typeof data === 'object') {
      console.log(1)
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }
  defineReactive (obj, key, value) {
    // 递归遍历，先把最后的value值数据劫持了先
    this.observer(value)
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false,
      get () {
        // 收集这个值的依赖，谁用到这个值，谁就是依赖
        return value
      },
      set: (newVal) => {
        this.observer(newVal) // 重点：对新值是对象的进行重新数据劫持
        if (newVal !== value) {
          value = newVal // 重点：这样obj.key === newVal
        }
      }
    })
  }
}