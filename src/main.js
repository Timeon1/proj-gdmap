import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { elementPlugins } from "./plugins/element"
Vue.config.productionTip = false
console.log(elementPlugins)
new Vue({
  router,
  store,
  elementPlugins,
  render: h => h(App)
}).$mount('#app')
