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
    const dep = new Dep() // 创建依赖收集对象
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false,
      get () {
        if (Dep.target) { // 收集这个值的依赖，谁用到这个值，谁就是依赖。而依赖和watcher又是关联的，所以也就是收集观察者
          dep.addSub(Dep.target)
        }
        return value
      },
      set: (newVal) => {
        this.observer(newVal)
        if (newVal !== value) {
          value = newVal
          dep.notify() // 数据更新，依赖通知观察者更新视图
        }
      }
    })
  }
}