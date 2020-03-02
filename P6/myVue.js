class MyVue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$options = options
    if (this.$el) {
      new Observer(this.$data) // 数据劫持
      new Compile(this.$el, this)
      // 2. proxy代理
      this.proxyData(this.$data)
    }
  }
  proxyData (data) {
    for(let key in data) {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: false,
        get () {
          return data[key]
        },
        set (newVal) {
          data[key] = newVal
        }
      })
    }
  }
}