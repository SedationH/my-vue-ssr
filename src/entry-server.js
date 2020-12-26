import { createApp } from './app'

// 利用 async Promise 进行改造
export default async context => {
  const { router, app } = createApp()
  const meta = app.$meta()
  router.push(context.url)
  // context 中的信息可以被index.template.html使用
  context.meta = meta
  // 因为进入的页面可能是异步导入的
  await new Promise(router.onReady.bind(router))
  return app
}

// export default context => {
//   // since there could potentially be asynchronous route hooks or components,
//   // we will be returning a Promise so that the server can wait until
//   // everything is ready before rendering.
//   return new Promise((resolve, reject) => {
//     const { app, router } = createApp()

//     // set server-side router's location
//     router.push(context.url)

//     // wait until router has resolved possible async components and hooks
//     router.onReady(() => {
//       const matchedComponents = router.getMatchedComponents()
//       // no matched routes, reject with 404
//       if (!matchedComponents.length) {
//         return reject({ code: 404 })
//       }

//       // the Promise should resolve to the app instance so it can be rendered
//       resolve(app)
//     }, reject)
//   })
// }
