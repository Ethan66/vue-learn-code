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
