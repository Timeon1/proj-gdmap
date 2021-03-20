// elementUI 按需加载
// import {App as VM} from 'vue'
import {
  Button
} from 'element-ui'

const plugins = [
  Button
]

export const elementPlugins = {
  install(vm){
    plugins.forEach(item=>{
      vm.component(item.name, item)
    })
  }
}