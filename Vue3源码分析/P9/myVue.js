class MyVue {
  constructor (options) {
    this._data = options.data
    this._template = document.querySelector(options.el)
    this._parent = this._template.parentNode
    this.initData() // 初始化数据
    this.mount() // 挂载
  }
  initData () {
    reactify(this._data) // 响应式
    Object.keys(this._data).forEach(key => {
      proxy(this, '_data', key)
    })
  }
  mount () {
    this.render = this.createRenderFn() // 生成VNode
    this.mountComponent()
  }
  mountComponent () {
    let mount = () => {
      this.update(this.render())
    }
    mount.call(this) // 实际应该是给watcher来调用
  }
  createRenderFn () {
    let ast = getVNode(this._template) // 获取带坑的VNode
    return function render () {
      let _tmp = combine(ast, this._data)
      return _tmp
    }
  }
  // 将VNode渲染到页面中，diff算法在里面
  update (vnode) {
    let realDom = parseVNode(vnode)
    this._parent.replaceChild(realDom, document.querySelector('#root'))
  }
}