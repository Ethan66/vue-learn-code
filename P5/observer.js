class Observer {
  constructor (data) {
    this.observer(data)
  }
  observer (data) {
    // { person: { name: '张三', fav: { a: '爱好'} } }
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }
  defineReactive (obj, key, value) {
    // 递归遍历，先把最后的value值数据劫持了先
    this.observer(value)
    // 1. 创建依赖收集对象
    const dep = new Dep()
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false,
      get () {
        // 2. 收集这个值的依赖，谁用到这个值，谁就是依赖
        if (Dep.target) {
          debugger
          dep.addSub(Dep.target)
        }
        return value
      },
      set: (newVal) => {
        this.observer(newVal)
        if (newVal !== value) {
          value = newVal
          // 4. 数据更新，依赖通知观察者更新视图
          dep.notify()
        }
      }
    })
  }
}