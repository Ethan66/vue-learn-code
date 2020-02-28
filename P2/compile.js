class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm

    // 1. 将node节点转为文档碎片对象，减少页面的回流和重绘
    const fragment = this.node2Fragment(this.el)
    console.log('fragment：', fragment)

    // 2. 编译模板
    this.compile(fragment)

    // 3. 追加文档碎片对象到根元素
    this.el.appendChild(fragment)
  }

  isElementNode (node) { // 判断el是否是元素标签
    return node.nodeType === 1
  }

  node2Fragment (el) {
    const f = document.createDocumentFragment()
    let firstChild
    while(firstChild = el.firstChild) {
      f.appendChild(firstChild)
    }
    return f
  }

  compile (fragment) {
    const childNodes = fragment.childNodes;
    [...childNodes].forEach(node => {
      if (this.isElementNode(node)) {
        console.log('元素节点：',node)
        // 编译元素节点
      } else {
        console.log('文本节点: ', node)
        // 编译文本节点
      }
      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    })
  }
}
