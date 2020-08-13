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

### Vue2.5.16源码分析
vue.js来自https://github.com/qq281113270/vue，存在问题：没有目录，不方便查看。根据神仙朱的https://cloud.tencent.com/developer/column/79378/tag-10197的结构进行优化。

#### 依赖收集
[基本数据类型](https://cloud.tencent.com/developer/article/1479270)
[引用类型](https://cloud.tencent.com/developer/article/1479267)
[依赖更新](https://cloud.tencent.com/developer/article/1479254)

##### 数据初始化
vue初始化，先执行vm._init()方法，执行mergeOptions()方法，生成新的data()函数。然后执行initData()方法，执行新的data（将mixins和当前组件的data函数执行再合并）,返回的对象存入vm._data中，再执行proxy()将vm._data进行代理，可以直接用vm.data访问。再执行observe()对数据进行响应式。创建Observer实例，将observer实例赋值给对象的__ob__属性，证明这个对象是已经做了响应式的。再判断对象是数组还是对象，对象的话遍历属性，执行defineReactive()，并对每个属性创建Dep实例，递归设置get，set，假如value还是对象，递归执行observe()。Dep实例赋值给observe实例的dep属性。对象数组有__ob__属性，基本类型没有。

##### 依赖如何收集
页面P使用的数据D，渲染P的时候先将模板字符串转为render函数，执行render函数的时候获取D，执行Object.defineProperty.get方法，此时的Dep.target指向P的watcher,此时数据D就收集Dep.target，执行Dep.addSub函数，将watcher存到dep实例的subs数组里。

##### 如果页面只使用了数据D，为什么修改D里对象的属性时，也会更新页面
触发数据Dget的get时，假如数据D有子对象，就会把Dep.target push给对象的__ob__.dep.subs和子对象的__ob__.dep.subs数组中。所以不管修改D的属性，还是D子对象的属性，都会调用dep.notify()，遍历subs里的watcher，执行watcher.update, watcher.update执行的是watcher.getter方法，更新页面。Vue.$set(target, key, value), Vue.$delete也是执行target.__ob__.dep.notify()

#### watch
[白话文](https://cloud.tencent.com/developer/article/1479092)
问题：1、监听的数据改变的时，watch如何工作。2、设置immediate时，watch如何工作。3、设置了deep时，watch如何工作。

##### 监听的数据改变的时，watch如何工作
watch在一开始初始化的时候，会对每一个watch创建一个watcher实例。创建watcher实例时会读取一遍监听的数据的值，于是，此时那个数据就收集到watch的watcher了。然后你给watch设置的handler，watch会放入watcher的更新函数中。当数据改变时，通知watch的watcher进行更新，于是你设置的handler就被调用了。

##### 设置 immediate时，watch如何工作
当你设置了immediate时，就不需要在数据改变的时候才会触发。而是在初始化watch时，在读取了监听的数据的值之后，便立即调用一遍你设置的监听回调，然后传入刚读取的值

##### 设置了deep时，watch如何工作
我们都知道watch有一个deep选项，是用来深度监听的。什么是深度监听呢？就是当你监听的属性的值是一个对象的时候，如果你没有设置深度监听，当对象内部变化时，你监听的回调是不会被触发的。比如我们用Object.defineProperty()设置了对象中的每一个属性，但是属性改变的时候只能触发属性的set值，不能触发对象的set值。所以设置deep后，会递归遍历这个值，把内部所有属性逐个读取一遍，于是属性和它的对象值内每一个属性都会收集到watch的watcher

[源码版](https://cloud.tencent.com/developer/article/1479300)
初始化Vue实例的时候，在beforeCreate和created之间，会执行initState()函数，这个函数包含处理data，watch, props，computed等数据。先对$options.data进行数据响应式。再处理$options.watch，遍历每一个属性，每个watch都可能配置3种方式：name(){}, name: { handler(){} }, name: 'getName'，先获取响应的回调函数，将key和callback传入vm.$watch中执行，为每一个属性创建一个Watcher实例，将key和callback存入实例中，执行vm.get()，根据key获取data中的值，触发了get函数，此时data中的数据就收集了实例，当data变化的时候，就会触发set函数，回调函数就会被触发。所有的Watcher实例存储到vm._watcher数组中。watcher实例创建中假如有deep===true，直接遍历data对象中的每一个属性，这样就完成了依赖收集。immediate是在watcher实例创建完成后，判断是否有immediate，有的话就去执行callback函数。

#### computed
[白话文](https://cloud.tencent.com/developer/article/1479094)
[源码版](https://cloud.tencent.com/developer/article/1479111)

##### 初始化
初始化Vue实例时，在beforeCreate和created之间，会执行initState()函数，这个函数包含处理data，watch, props，computed等数据。处理$options.computed，遍历每一个属性，对每个属性进行Watcher实例化，把get方法和{lazy: true}传入。get函数作为watcher实例的cb和getter, watcher.dirty=lazy，脏值属性，true表示缓存watcher.value脏了，得重新缓存，初始化的时候不执行get()函数，此时watcher.value为undefined，用于存储计算结果。所有watch实例存入vm._computedWatchers和vm._watchers中。然后再遍历computed属性，将属性绑定到vm上，并设置为数据监听。将computed的set(),新get()绑定上去。当获取computed的值时，就执行新get()，判断watcher.dirty是否为true, 执行watcher.getter(), 保存到watcher.value中，把watcher.dirty改为false。

##### computed里的data数据B改变
当B改变时，会通知所有的依赖，即watcher.update()被触发，update判断是否存在watcher.lazy，将watcher.dirty= true。当再次读取computed里的数据时，就会触发新get()，进行更新。

##### 页面P引用了computed数据C，C引用了data数据D，D修改，变化顺序是怎么样的
其实D会同时收集C和P的watcher，当D修改后，会遍历顺序通知wather，先通知C的watcher，将this.dirty = true，此时还没有执行C的wather.getter(),值还没有更新。所以再去通知P的watcher，P的watcher执行后，重新渲染页面，需要重新获取C的值，此时因为C.watcher.dirty===true, 所以不会拿缓存值，调用C.watcher.getter()
重复计算。

#### NextTick
[白话文](https://cloud.tencent.com/developer/article/1479325)
[源码版](https://cloud.tencent.com/developer/article/1479324)
[源码版](https://cloud.tencent.com/developer/article/1479319) // 可忽略
[源码版](https://cloud.tencent.com/developer/article/1479317)

##### 白话版
Vue的nextTick不止使用了setTimeout，还涉及了js的宏微任务：两个setTimeout就是两个宏任务，两个Promise就是两个微任务，执行完一个宏任务，就执行一个微任务，这样就完成一个Event Loop。循环执行Event Loop。Vue2.6之前是使用宏微任务，之后都使用微任务。比如一个数据D被页面P引用了，D就会收集P的watcher，假如数据被连续修改3次，页面只更新了一次。原因：当数据变化，把watcher.update存入nextTick的回调数组中，通过watcher.id来判断回调数组是否存在，不存在才push。所以连续修改3次只有一次push成功，所以页面才会更新一次。

##### 源码版
页面P引用了数据D1，D2，修改了数据D1，就会触发P的watcher.update，把watcher.id存入has数组中，把P的watcher存入queue（queue可能还有watch里的watcher）数组中，然后调用nextTick(flushSchedulerQueue)，将flushSchedulerQueue存入callbacks（callbacks里还有开发者的nextTick里的callback）数组中，判断pending是否为false，为false执行new Promise()，因为Promise为宏任务，把pending改为true。此时假如修改了D2，触发P的watcher.update，此时has已经有P的watcher.id，就跳过了。最后执行Promise.then()，then为微任务，然后遍历callbacks数组，执行callback函数，遍历queue数组，先升序queue，将id大的往后排（id大的表示后生成），执行wather.run()函数，把has数组和callback数组清空，pending改为flase

##### NextTick的宏微任务的抉择
本来Vue都是用微任务的，因为微任务的优先级比较高，执行比较快。Vue2.6之前是宏微任务，怎么考虑：考虑到冒泡事件，body下的div父元素和p子元素，2个元素点击事件里都有log('div')，new Promise().then(log('promise'))，结果打印的是div, promise, div, promise，我们的预期应该是宏任务走完了才走微任务，但是现在不是，假如在2个事件回调中修改了数据D，就会执行2次微任务，也就更新了2次。所以尤大大想到了在事件回调执行的时候，注册是宏任务setImmediate（表示浏览器执行完后面的其他语句后，马上执行），不是微任务，这样执行的顺序是div, div, promise, promise。

#### Mixins
[白话版](https://cloud.tencent.com/developer/article/1479108) // 面试的话没问题
[源码版](https://cloud.tencent.com/developer/article/1479221) // 不需要断点，这里很清晰

##### 什么时候合并
vue实例化之前，全局设置了Vue.options的三个属性，components（全局组件），directives（全局指令），filters（全局过滤器）。vue实例化时候，在beforeCreate之前，调用mergeOptions方法，传入Vue.options和配置的options进行合并。

##### 怎么合并
mergeOptions函数会判断配置的options里有没有mixins属性，有的话先递归mergeOptions方法，将mixins里的配置options先合parent（Vue.options）合并，之后再遍历parent和child（当前组件的options）,进行合并。

##### data()合并和生命钩子
执行data()方法得到对象合并，相同属性的value是基本类型，用当前组件的数据，引用类型递归合并对象。

##### 生命钩子和watch
生命钩子和watch都是保存到数组，先执行全局mixins和钩子，再执行组件mixins的钩子，最后执行当前组件的钩子。

##### components, direactives, filters合并
并没有进行遍历合并，而是存在对象的原型上。obj.self_filter: 当前组件的filter，obj.__ptoto__.mixins_filter: 组件mixins的filter，obj.__proto__.__proto__.global_filter: 全局filter

##### props, computed, methods
唯一性。权重谁大用谁的，当前组件>mixins>全局

#### props
[白话版](https://cloud.tencent.com/developer/article/1479097) // 比源码清楚
[源码版](https://cloud.tencent.com/developer/article/1479303) // 子组件如何更新讲的好
##### 初始化实例
```
// 父组件
<div id="#app">
  <child :child-name="parentName" />
</div>

// js
new Vue({    
  el:"#app",        
  components:{        
    child:{            
      props:{                
          childName:""
      },            
    template: '<p>父组件传入的 props 的值 {{childName}}</p>'
    }
  },
  data(){        
    return {            
      parentName:"我是父组件"
    }
  },
})
```

##### 父组件如何传值给子组件
```
// 父组件的模板会被解析成一个模板渲染函数，_c是渲染组件的函数，width的作用是将大括号内所有的变量都带上this，此时的this为父组件
(function() {    
  with(this){
    return _c('div',{staticId:"app"},[
      _c('child',{attrs:{"child-name":parentName}})
    ],1)
  }
})
```
当父组件开始渲染的时候，模板字符串会变成模板渲染函数，执行模板渲染函数的时候，里面所有变量都是从父组件获取，此时父组件就把值传给子组件：_c('child',{attrs:{"child-name":'我是父组件'}})，渲染子组件的时候attrs里吧props里筛选出来，保存到child._props里，对child._props里进行数据劫持，子页面使用了_props就进行收集watcher，child._props改变就进行重新渲染子页面。和父组件唯一的不同是，child._props不会对对象所有属性进行数据劫持。因为父组件已经对该数据进行了数据劫持，减少重复工作。最后对子组件的props进行数据代理，取和设置都拿child._props的值。

##### 父组件data更新，子组件的props如何更新
第一次渲染的时候，页面获取了parentName的值，parentName就收集了页面的watcher，修改了父组件的parentName，就会调用页面的watcher.update，重新执行模板渲染函数，子组件就获取最新的值。假如传入的是基本类型，子组件改变不会影响父组件；假如传入的是对象，子组件改变会影响父组件，因为是同一个地址。

##### 子组件如何更新
props是基本类型时，因为子组件对child._props做了数据劫持，所以子组件内部props通知子组件更新的。但是props对象没有对所有属性进行数据拦截，那父组件修改props对象的属性时，怎么通知子组件重新渲染？答：父组件传对象给子组件，并且父子组件都使用了这个数据，这个对象会收集父子组件的watcher，所以父组件的数据属性修改时，父组件的数据data通知子组件更新的。

#### vue从创建到挂载的过程
[参考](https://nlrx-wjc.github.io/Learn-Vue-Source-Code/lifecycle/newVue.html#_1-%E5%89%8D%E8%A8%80)

##### beforeCreate之前
 初始化Vue实例时，执行vue._init()方法，调用mergeOptions()方法，校验配置的options的规范（components命令，props是否是对象数组等），如果配置项里有mixins，递归调用mergeOptions方法，把mixins的配置项匹配给parent，再遍历配置的options，把每项与父级构造函数的options属性进行合并（如果childVal不存在，就返回parentVal,如果存在，就把childVal添加到parentVal后，比如生命钩子，所以mixins里的生命周期早于当前实例执行），将得到一个新的options选项赋值给$options属性。再执行beforeCreate钩子，此时还没有$el和$data。

##### created之前
接着调用initState()方法，处理$options里每个属性，先处理props，再给data实现数据劫持，最后给watch，computed添加观察者。再执行created钩子。
再判断$options.el是否存在，执行vue.$mount()方法。

##### beforeCreate之前
vue有2个版本的代码：runtime only（只包含运行时版本）和runtime+compiler（同时包含编译器和运行时的完整代码）。他们的区别就是编译器，将template转化为render函数，用runtime only做实际开发，同时借助webpack的vue-loader，通过这工具来将模板编译成render函数。

所以两个版本区别在于：vue.$mount()方法是否将Vue原型的$mount方法缓存起来，直接执行$mount的就是runtime only版本，否则就是完整版本。完整版先根据传入的el获取dom元素，判断有无配置render函数，没有的话判断配置是否有template模板，是字符串且是id的，或者是dom的直接获取innerHtml，没有配置template就是el作为innerHtml。将模板字符串编译成render函数。传给$options.render，再执行原始vm.$mount()函数。

##### mounted之前
开始挂载，执行beforeCreate()钩子，实例化watcher观察者，将定义的updateComponent方法传给实例，运行updateComponent方法，先执行vm._render()方法获取最新的节点，再执行vm._update()比较最新和就的节点（即patch），完成渲染。这时候就会读取数据，调用get方法就把实例化的watcher存入数据的依赖收集中，修改数据，就会触发watcher.update，然后触发updateComponent方法，再进行新旧节点对比，完成渲染。

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
