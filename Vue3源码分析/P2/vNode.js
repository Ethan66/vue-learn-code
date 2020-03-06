class VNode {
  constructor (tag, data, value, type) {
    this.tag = tag && tag.toLowerCase()
    this.data = data
    this.value = value
    this.type = type
    this.children = []
  }
  appendChild (vnode) {
    this.children.push(vnode)
  }
}

function getVNode (node) {
  let nodeType = node.nodeType
  let _vnode = null
  if (nodeType === 1) {
    let nodeName = node.nodeName
    let [...attrs] = node.attributes
    let _attrObj = {}
    attrs.forEach(attr => {
      _attrObj[attr.nodeName] = attr.nodeValue
    })
    _vnode = new VNode(nodeName, _attrObj, undefined, nodeType)
    let childNodes = node.childNodes
    childNodes.forEach(node => _vnode.appendChild(getVNode(node)))
  } else if (nodeType === 3) {
    _vnode = new VNode(undefined, undefined, node.nodeValue, nodeType)
  }
  return _vnode
}

let root = document.querySelector('#root')
console.log(getVNode(root))

function parseVNode (vnode) {
  let type = vnode.type
  let _node = null
  if (type === 3) {
    return document.createTextNode(vnode.value)
  } else if (type === 1) {
    _node = document.createElement(vnode.tag)
    Object.keys(vnode.data).forEach(key => {
      _node.setAttribute(key, vnode.data[key])
    })
    vnode.children.forEach(subvnode => {
      _node.appendChild(parseVNode(subvnode))
    })
  }
  return _node
}
