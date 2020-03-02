#### 前言
此为课堂摘要。来自bilibili————小马哥_老师————Vue源码解析

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