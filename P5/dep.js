// 功能：监听旧值和新值是否一样，不一样就去触发callback去更新视图
class Watcher {
  constructor (vm, expr, callback) {
    this.vm = vm
    this.expr = expr
    this.callback = callback
    this.oldVal = this.getOldVal()
  }
  // 初始化的时候就要获取old值
  getOldVal () {
    Dep.target = this // 3. 把watcher挂载到Dep上
    const oldVal = compileUtil.getVal(this.expr, this.vm)
    Dep.target = null
    return oldVal
  }
  update () {
    const newVal = compileUtil.getVal(this.expr, this.vm)
    if (newVal !== this.oldVal) {
      debugger
      this.callback(newVal)
    }
  }
}

// 依赖收集
class Dep {
  constructor () {
    this.subs = []
  }
  addSub (wwatcher) {
    this.subs.push(wwatcher)
  }
  notify () {
    console.log('通知观察者', this.subs)
    this.subs.forEach(w => w.update())
  }
}