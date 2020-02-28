class MyVue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$options = options
    if (this.$el) {
      new Compile(this.$el, this)
      new Observer(this.$data) // 数据劫持
    }
  }
}