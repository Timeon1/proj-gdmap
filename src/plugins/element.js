// elementUI 按需加载
import {
  Button,
  Icon
} from 'element-ui'

const plugins = [
  Button,
  Icon
]
const elementPlugins = {
  install: function (Vue) {
    plugins.forEach(item => {
      Vue.component(item.name, item)
      // Vue.use(item)
    })
  }
}
export default elementPlugins