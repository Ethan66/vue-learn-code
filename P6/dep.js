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
    Dep.target = this // 把watcher挂载到Dep上
    const oldVal = compileUtil.getVal(this.expr, this.vm) // 刚渲染页面时获取的oldVal, 并把watcher push到依赖集合中
    Dep.target = null // 因为watcher已经push到依赖集合中，防止get时又push一遍，所以就要删除
    return oldVal
  }
  update () {
    const newVal = compileUtil.getVal(this.expr, this.vm)
    if (newVal !== this.oldVal) {
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
    // 9. 遍历依赖集合通知watcher去更新
    this.subs.forEach(w => w.update())
  }
}