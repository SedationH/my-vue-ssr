import Vue from 'vue'
import App from './App.vue'
import VueMeta from 'vue-meta'
import { createRouter } from './router/'

Vue.use(VueMeta)

Vue.mixin({
  metaInfo: {
    titleTemplate: '%s - DEMO',
  },
})

// If we use a shared instance across multiple requests,
// it will easily lead to cross-request state pollution.
export function createApp() {
  const router = createRouter()
  const app = new Vue({
    router,
    render: h => h(App),
  })
  return { app, router }
}
