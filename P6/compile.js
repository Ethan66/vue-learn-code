class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm

    const fragment = this.node2Fragment(this.el)
    // console.log('fragment：', fragment)

    this.compile(fragment)

    this.el.appendChild(fragment)
  }

  isElementNode (node) {
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
        // console.log('元素节点：',node)
        this.compileElement(node)
      } else {
        // console.log('文本节点: ', node)
        this.compileText(node)
      }
      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    })
  }

  compileElement (node) { // 将元素节点的属性进行编译
    const attributes = node.attributes;
    // console.log(attributes);
    [...attributes].forEach(attr => {
      const { name, value } = attr
      if (this.isDirective(name)) {
        const [, directive] = name.split('-') // text, html, model, on:click, bind:src
        const [dirName, eventName] = directive.split(':') // 获取dirName：text/html/model/bind和eventName: click, src
        // 更新数据 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName)

        // 删除有指令的标签的属性
        node.removeAttribute('v-' + directive)
      } else if (this.isDirectiveEvent(name)) {
        compileUtil.on(node, value, this.vm, name.slice(1))
      } else if (this.isDirectiveBind(name)) {
        compileUtil.bind(node, value, this.vm, name.slice(1))
      }
    })
  }

  compileText(node) { // 编译文本,直接将双括号的内容进行替换
    // {{person.name}}-{{person.age}}
    if (/\{\{.+?\}\}/g.test(node.textContent)) {
      // console.log('带大括号的文本：', node.textContent)
      compileUtil.text(node, node.textContent, this.vm)
    }
  }

  isDirective (name) {
    return name.startsWith('v-')
  }
  isDirectiveEvent (name) {
    return name.startsWith('@')
  }
  isDirectiveBind (name) {
    return name.startsWith(':')
  }
}

const compileUtil = {
  getVal(expr, vm) {
    return expr.split('.').reduce((data, currentVal) => {
      // console.log(currentVal)
      return data[currentVal]
    }, vm.$data)
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm)
    })
  },
  setVal (expr, vm, inputVal) {
    const length = expr.split('.').length
    let i = 0
    return expr.split('.').reduce((data, currentVal) => {
      i++
      if (length > i) {
        return data[currentVal]
      } else {
        data[currentVal] = inputVal
      }
    }, vm.$data)
  },
  text(node, expr, vm) {
    let value = ''
    if (/\{\{.+?\}\}/g.test(expr)) { // {{person.name}}-{{person.age}}
      value = expr.replace(/\{\{(.+?)\}\}/g, (...arg) => {
        // console.log('去掉双括号获取的expr: ', arg[1])
        new Watcher(vm, arg[1], () => {
          this.updater.textUpdater(node, this.getContentVal(expr, vm))
        })
        return this.getVal(arg[1], vm)
      })
      // console.log('文本节点编译：', value)
    } else {
      value = this.getVal(expr, vm) // 获取属性对应vue里真正的值，expr是表达式：person.fav
      new Watcher(vm, expr, (newVal) => {
        this.updater.textUpdater(node, newVal)
      })
    }
    this.updater.textUpdater(node, value) // 将真正的值绑定到属性里
  },
  html(node, expr, vm) {
    const value = this.getVal(expr, vm) // 渲染页面获取oldVal,此时没有Dep.target，所以不会watcher.push
    new Watcher(vm, expr, (newVal) => { // 初始化watcher，把更新视图的callback传入
      this.updater.htmlUpdater(node, newVal)
    })
    this.updater.htmlUpdater(node, value)
  },
  model(node, expr, vm) {
    const value = this.getVal(expr, vm)
    // 绑定更新函数，数据驱动视图
    new Watcher(vm, expr, (newVal) => {
      this.updater.modelUpdater(node, newVal)
    })
    // 1. 视图驱动数据再驱动视图
    node.addEventListener('input', e => {
      // 设置值
      this.setVal(expr, vm, e.target.value)
    })
    this.updater.modelUpdater(node, value)
  },
  bind(node, expr, vm, attributeName) {
    const value = this.getVal(expr, vm)
    this.updater.bindUpdater(node, value, attributeName)
  },
  on(node, expr, vm, eventName) {
    node.addEventListener(eventName, vm.$options.methods[expr].bind(vm), false)
  },
  updater: {
    textUpdater(node, value) {
      node.textContent = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
    modelUpdater(node, value) {
      node.value = value
    },
    bindUpdater(node, value, attributeName) {
      node.setAttribute(attributeName, value)
    }
  }
}
