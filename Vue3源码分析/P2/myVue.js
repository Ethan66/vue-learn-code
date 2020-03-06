// // 1. 拿到模板
// // 2. 拿到数据
// // 3. 将数据与模板结合，得到是HTML元素
// // 4. 放到页面中
class MyVue {
  constructor (options) {
    // vue习惯：内部数据使用下划线开头，只读数据使用$开头
    this._data = options.data
    this._el = options.el
    this.$el = this._templateDom = document.querySelector(this._el)
    this._parent = this._templateDom.parentNode

    this.render()
  }
  compiler () {
    let realDom = this._templateDom.cloneNode(true)
    compiler(realDom, this._data)
    this.update(realDom)
  }
  update (realDom) {
    this._parent.replaceChild(realDom, document.querySelector('#root'))
  }
  render () {
    this.compiler()
  }
}

function compiler (tempNode, data) {
  let [...childNodes] = tempNode.childNodes
  childNodes.forEach(node => {
    if (node.nodeType === 1) { // 元素节点
      if (node.childNodes && node.childNodes.length) {
        compiler(node, data)
      }
    } else if (node.nodeType === 3) { // 文本节点
      node.textContent = node.textContent.replace(/\{\{(.+?)\}\}/g, (...arg) => {
        return data[arg[1]]
      })
    }
  })
}