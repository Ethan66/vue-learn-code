class MyVue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$options = options
    if (this.$el) { // 1. 判断是否有根元素，有才能进行模板编译，所以每一个vue实例都要有根元素
      new Compile(this.$el, this) // 2. 实现编译模板
      // 3. 实现数据观察者
    }
  }
}