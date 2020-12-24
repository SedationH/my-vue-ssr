const express = require('express')
const fs = require('fs')
const {
  createBundleRenderer,
} = require('vue-server-renderer')
const setupDevServer = require('./build/setup-dev-server')
const isProd = process.env.NODE_ENV === 'production'

const service = express()

service.use('/dist', express.static('./dist'))

let onReady, renderer
// 根据模式选择 renderer 的生成方式
if (isProd) {
  const template = fs.readFileSync(
    './index.template.html',
    'utf-8'
  )
  const serverBundle = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  renderer = createBundleRenderer(serverBundle, {
    template,
    clientManifest,
  })
} else {
  // 开发模式 -> 监视打包构建 -> 重新生成 Renderer 渲染器
  onReady = setupDevServer(
    service,
    (serverBundle, template, clientManifest) => {
      // 通过在setup-dev-server中调用回调来生成这个module中的renderer
      renderer = createBundleRenderer(serverBundle, {
        template,
        clientManifest,
      })
    }
  )
}

const context = {
  title: 'SedationH',
  meta: `
    <meta name="description" content="ssr demo">
  `,
}

const render = async (req, res) => {
  try {
    const html = await renderer.renderToString(context)
    res.setHeader('Content-Type', 'text/html; charset=utf8')
    res.end(html)
  } catch (err) {
    console.log(err)
    res.status(500).end('Internal Server Error.')
  }
}

// onReady 只是刚开始pending一下，后面其实都是fulfilled了，
// 只是每次访问使用不同的renderer产生的结果不一样
service.get(
  '*',
  isProd
    ? render
    : async (req, res) => {
        // 在开发模式下 renderer 是异步生成的 需要等待
        await onReady
        render(req, res)
      }
)

service.listen(3000, () =>
  console.log('http://localhost:3000')
)
