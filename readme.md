### 前言
P2-P6。来自bilibili————小马哥_老师————Vue源码解析

#### P1

#### P2(代码)
> 入口函数和模板编译实现：
1. 判断是否有根元素。有根元素才能进行编译
2. 将根元素的所有子节点放入文档碎片对象中，阻止重绘和回流
3. 遍历文档碎片对象的所有子节点，区分文本节点和元素节点，进行编译（P3）
4. 将编译好的文档碎片对象放回根元素

#### P3(代码)
> 编译文档碎片对象：
1. 编译元素节点，获取元素节点的所有属性，判断是不是指令。1、是指令(text/html/model)，获取属性和属性值的expression，去vm找真正的值，再添加到node里。2、是指令(on:)，获取eventName和属性值的expression，去vm.methods找方法，再添加node里监听，注意bind替换this指向。
2. 编译文本节点，根据正则将textContent里的{{}}的值给替换掉。再调用之前text的指令去添加到node里。
3. 特殊指令：@指令/bind指令/:指令。

#### P4(代码)
> 对data里的数据进行数据劫持:
遍历data中的所有属性(包括子属性)，进行数据劫持。

#### P5(代码)
> 逻辑：先进行数据劫持(Observer)。再初始化页面(compile)的时候需要获取data中的值，此时就要调用get方法，实例化依赖集合dep。下一步就是new Watcher(), 谁用了数据谁就是依赖。所以此时的依赖是node，只是将更新node的方法当做回调放入Watcher中。将watcher实例放入Dep.target中, 获取OldVal,此时又调用了get()方法，将watcher实例存入了dep实例中。
当修改属性值时，触发了set()方法，set方法遍历依赖集合dep,执行watcher实例的update方法，此时watcher实例中已有更新node的回调方法，所以触发这个回调就好了。

#### P6(代码)
1. 双向的数据绑定
2. Proxy代理：将this.$data.key = val 改用为this.key = val

#### P7(话术)
> 阐述一下你所理解的MVVM响应式原理：
vue是采用数据劫持配合发布者-订阅者模式的方式，通过Object.defineProperty()来劫持各个属性的setter和getter,在数据变化时，发布消息给依赖收集器，去通知观察者，做出对应的回调函数，去更新视图

>详细：new MVVM作为绑定的入口，整合Observer，Compile和Watcher三者，通过Observer来监听model数据变化，通过Compile来解析编译模板指令，最终利用Watcher搭起Observer,Compile之间的通信桥梁，达到数据变化到视图更新，视图交互变化到数据model变化的双向绑定效果。

### Vue3源码
Vue3源码分析。来自bilibili————YanToT————Vue源码分析

#### P2 虚拟DOM(代码)

```
// <div /> => { tag: 'div' }
// 文本节点 => { tag: undefined, value: '文本节点' }
// <div title="1" class="c" /> => { tag: 'div', data: { title: '1', class: 'c' } }
// <div><div /></div> => { tag: 'div', children: [{ tag: 'div' }] }
```
#### P3 函数科里化
> 函数科里化：一个函数原本有好多个参数，只传入一个函数，生成一个新函数。由新函数接收剩下的参数来运行得到结果。
偏函数：一个函数原本有多个参数，只传入一部分参数，生成一个新函数。由新函数接收剩下的参数来运行得到结果。
高阶函数：一个函数参数是一个函数，该函数对参数这个函数进行加工，得到一个函数。这个加工用的函数就是高阶函数。

> Vue的本质是使用HTML的字符串作为模板，将字符串的模板转换为AST(抽象语法树)，再转换为VNode，VNode再转为DOM。

> 最消耗性能的是字符串模板转为AST(抽象语法树)。为什么？
例子：let s = '1 + 2 * ( 3 + 4 * ( 5 + 6 ) )'写一个程序，解析这个表达式，得到结果。
一般会将这个表达式转换为“波兰式”表达式，然后使用栈结构来运算。

同样，在Vue中每一个标签可以是真正的HTML标签，也可以是自定义组件。怎么区分？
在Vue源码中其实将所有可以用的HTML标签存起来。
```
let tags = 'div,p,a,img,ul,li'.split(',')
// 判断一个标签是否是内置标签
function isHTMLTag (tagName) {
  tagName = tagName.toLowerCase()
  if (tags.includes(tagName)) return true // includes内部也是循环遍历
  return false
}
// 如果有6个内置标签，而模板中有10个标签需要判断，就需要执行60次循环。实际的Vue内置标签和使用的标签更多。

// Vue采取的方法(makeMap)，采用科里化处理
function makeMap(tags) {
  let set = {}
  tags.forEach(html => {
    set[html] = true
  })
  return function (tag) {
    return !!set[tag.toLowerCase()]
  }
}
let isHtmlTag = makeMap(tags) // 返回函数，就变成了一次循环
```

#### P4 利用VNode来模拟抽象语法树来渲染DOM(代码)

#### P7 响应式原理
> defineProperty和数组方法的拦截(将原始方法(push,pop等)进行存储，再替换新方法，新方法里先执行新方法，再执行原始方法)

```
// 继承关系： arr --> Array.prototype --> Object.prototype
// 修改后的继承关系：arr --> 改写的方法 --> Array.prototype --> Object.prototype

let ARRAY_METHODS = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse']
let array_methods = Object.create(Array.prototype)
ARRAY_METHODS.forEach(method => {
  array_methods[method] = function () {
    console.log('调用的是拦截的' + method + '方法')
    let res = Array.prototype[method].apply(this, arguments)
    return res
  }
})
let arr = []
arr.__proto__ = array_methods
```

#### P9 将data中的属性进行代理
```
Object.keys(this._data).forEach(key => {
  proxy(this, '_data', key)
})

function proxy (target, prop, key) {
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get () {
      return target[prop][key]
    },
    set (newVal) {
      target[prop][key] = newVal
    }
  })
}
```

#### P11 发布订阅模式
> Vue中，整个更新是按照组件为单位进行判断，以节点为单位进行更新。
如果代码中没有自定义组件，那么在比较算法时，会将全部的模板对应的虚拟DOM进行比较。
如果代码中有自定义组件，那么在比较算法时，会判断更新的是哪一些组件的属性，只会判断更新数据的组件，其他组件不会更新。

> 发布订阅模式：
1. 中间有一个全局容器(Vue中Dep)，用来存储可以被触发的函数，对象(Vue中Watcher)
2. 需要一个方法，可以往容器中传入的函数，对象(Vue中利用Dep.append传入Watcher)
3. 需要一个方法，可以将容器中的函数，对象取出来使用(Vue中是触发Watcher的更新函数)

```
// 发布订阅模式
var event = function () {
  let eventObjs = {}
  return {
    // 注册事件：可以连续注册，可以注册多个事件
    on: function (type, handler) {
      (eventObjs[type] || (eventObjs[type] = [])).push(handler)
    },
    // 移除事件：没有参数，移除所有事件；带有事件名参数，移除这个事件名下所有参数；有2个参数，那么移除某一个事件的具体处理函数
    off: function (type, handler) {
      let length = arguments.length
      if (length === 0) {
        eventObjs = {}
      } else if (length === 1) {
        eventObjs[type] = []
      } else if (length === 2) {
        let _events = eventObjs[type]
        if (!_events) return
        // 从最后一个开始删除
        for(let i = _events.length - 1; i>=0; i--) {
          if (_events[i] === handler) {
            _events.splice(i, 1)
          }
        }
      }
    },
    emit: function (type) {
      let _events = eventObjs[type]
      if (!_events) return
      _events.forEach(fn => {
        fn(...Array.prototype.slice.call(arguments, 1))
      })
    }
  }
}
```

#### P16 源码解读
```
├─src                    # 项目源代码
│    ├─complier          # 与模板编译相关的代码。在编译文件中存放对模板字符串解析的算法，抽象语法树，优化等
│    ├─core              # Vue构造函数，以及生命周期等方法的部分
│    │  ├─observe        # 实现变化侦测的代码
│    │  ├─vdom           # 实现virtual dom的代码
│    │  ├─instance       # Vue.js实例的构造函数和原型方法
│    │  ├─global-api     # 全局api的代码
│    │  └─components     # 内置组件的代码
│    ├─server            # 与服务端渲染相关的代码（略）
│    ├─platforms         # 特定运行平台的代码，如weex（略）
│    ├─sfc               # 单文件组件的解析代码（略）
│    └─shared            # 项目公用的工具代码
│    │  ├─constants      # 常量
```

### Vue2.6.10源码剖析之整体流程
来源：开课吧 -- 百度网盘视频

#### P1 vue源码调试环境搭建
dist打包文件输出格式：
1. cjs(common.js): webpack1, browserfiry。node环境和低版本打包器
2. esm(esm.js): webpack2+。为现代打包器准备的。也可以在开发环境。
3. umd(没有common和esm): 兼容cjs和amd。可以在node和浏览器运行。
4. runtime.js: 仅包含运行时，没有编辑器，已经提前打包了。

调试源码: clone 整个项目（vue 2.6.10）, 目录不能有中文，会报错。 npm i安装node_modules。
[参考教程](https://juejin.im/post/5c21fd4b518825566d2386e7)
```
// 通过sourcemap找到源代码
// 第一种方法：全局搜genConfig函数,添加上sourceMap:true
 const config = {
    input: opts.entry,
    sourceMap: true,
    ...
  }

// 第二种方法：package.json中的scripts
"dev": "rollup -w -c scripts/config.js --sourcemap --environment TARGET:web-full-dev",

# npm run dev // 因为我们要本地运行找到源代码，所以不能直接打包
// 打开html文件：examples/commits/index.html,修改其中script[src]对vue的引用，修改其文件名为：vue.min.js->vue.js
```

#### P2 入口文件
```
// package.json中的scripts
"dev": "rollup -w -c scripts/config.js --sourcemap --environment TARGET:web-full-dev",
// 找到scripts/config.js中的build对象的web-full-dev属性，value值就是对应的打包内容。入口文件：web/entry-runtime-with-compiler.js
```

#### P3 Vue初始化流程
```
1. web/entry-runtime-with-compiler.js
扩展了$mount方法：处理了template和el选项，将el和template全都转为render函数。去找引入的vue文件

2. src\platforms\web\runtime\index.js
定义了$mount方法，执行挂载mountComponent(this, el, hydrating)。实现了patch方法。去找引入的vue文件

3. src\core\index.js
定义全局API：initGlobalAPI(Vue)。去找引入的Vue文件

4. src\core\instance\index.js
执行初始化操作：this._init(options)
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)。执行了5个方法。去找初始化函数的实现

5. src\core\instance\init.js
initLifecycle(vm) // 生命周期的初始化: $parent,$children,$root,$refs
initEvents(vm) // 事件的初始化：把父组件传递的事件挂载到实例中
initRender(vm) // 额外渲染的初始化：$slot, $scopedSlots和render函数
callHook(vm, 'beforeCreate') // 调了beforeCreate的钩子
initInjections(vm) // 获取注入数据
initState(vm) // 初始化组建中的props/methods/data/computed/watch
initProvide(vm) // 提供数据(给后代)
callHook(vm, 'created')

if (vm.$options.el) {
  vm.$mount(vm.$options.el)
}

6. src\core\instance\state.js
定义了$data,$props,$set,$delete,$watch

7. src\core\instance\events.js
定义了$on,$emit,$once,$off

8. src\core\instance\lifecycle.js
定义了_update,$forceUpdate,$destroy

9. src\core\instance\render.js
定义了$nextTick,render
```

#### P5 数据响应化流程分析
```
src\core\instance\state.js
if (opts.data) {
    initData(vm)
  }
initData(vm): 调用observe()，去找observe方法

defineReactive(): 给data中每一个key定义数据劫持

src\core\observer\dep.js
维护和管理watch()
```