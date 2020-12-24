const express = require('express')
const serverBundle = require('./dist/vue-ssr-server-bundle.json')
const template = require('fs').readFileSync(
  './index.template.html',
  'utf-8'
)
const clientManifest = require('./dist/vue-ssr-client-manifest.json')
const {
  createBundleRenderer,
} = require('vue-server-renderer')

// 第 1 步：创建一个 renderer
const renderer = createBundleRenderer(serverBundle, {
  runInNewContext: false, // https://ssr.vuejs.org/zh/api/#runinnewcontext
  template, // （可选）页面模板
  clientManifest, // （可选）客户端构建 manifest
})
// 第2步：创建 service
const service = require('express')()

const context = {
  title: 'vue ssr demo',
  meta: `
        <meta name="keyword" content="vue,ssr">
        <meta name="description" content="vue srr demo">
    `,
}
service.use('/dist', express.static('./dist'))
service.get('/', (req, res) => {
  // 设置响应头，解决中文乱码
  res.setHeader('Content-Type', 'text/html;charset=utf8')

  // 第 3 步：将 Vue 实例渲染为 HTML
  // 这里的Vue实例，使用的是src/entry-server.js 中挂载的Vue实例
  // 这里无需传入Vue实例，因为在执行 bundle 时已经自动创建过。
  // 现在我们的服务器与应用程序已经解耦！
  renderer.renderToString(context, (err, html) => {
    // 异常时，抛500，返回错误信息，并阻止向下执行
    if (err) {
      console.log(err)
      res.status(500).end('Internal Server Error')
      return
    }

    // 返回HTML, 该html的值 将是注入应用程序内容的完整页面
    res.end(html)
  })
})

// 绑定并监听指定主机和端口上的连接
service.listen(3000, () =>
  console.log(`service listening at http://localhost:3000`)
)
