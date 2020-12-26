const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const webpack = require('webpack')
const devMiddleware = require('webpack-dev-middleware')
const hotMiddleware = require('webpack-hot-middleware')

const resolve = file => path.resolve(__dirname, file)

module.exports = (service, callback) => {
  // module return Promise
  // 向外暴露resolve方法
  let ready
  const onReady = new Promise(resolve => (ready = resolve))

  // 监视构建 -> 更新 Renderer

  let template
  let serverBundle
  let clientManifest

  const update = () => {
    if (template && serverBundle && clientManifest) {
      console.log('invoke update')
      ready()
      callback(serverBundle, template, clientManifest)
    }
  }

  // 监视构建 template -> 调用 update -> 更新 Renderer 渲染器
  const templatePath = path.resolve(
    __dirname,
    '../index.template.html'
  )
  template = fs.readFileSync(templatePath, 'utf-8')
  // update()

  // update 没必要在这里执行
  // init进行的时候进去 serverBundle clientManifest 必然没有
  // 后面更新是通过回调来实现的
  // fs.watch、fs.watchFile
  chokidar.watch(templatePath).on('change', () => {
    template = fs.readFileSync(templatePath, 'utf-8')
    update()
  })

  // 监视构建 serverBundle -> 调用 update -> 更新 Renderer 渲染器
  const serverConfig = require('./webpack.server.config')
  const serverCompiler = webpack(serverConfig)
  const serverCompilerDevMiddleware = devMiddleware(
    serverCompiler
  )
  serverCompiler.hooks.done.tap('server', () => {
    serverBundle = JSON.parse(
      serverCompilerDevMiddleware.context.outputFileSystem.readFileSync(
        resolve('../dist/vue-ssr-server-bundle.json'),
        'utf-8'
      )
    )
    update()
  })

  // 监视构建 clientManifest -> 调用 update -> 更新 Renderer 渲染器
  const clientConfig = require('./webpack.client.config')
  clientConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin()
  )
  clientConfig.entry = [
    'webpack-hot-middleware/client?quiet=true&reload=true', // 和服务端交互处理热更新一个客户端脚本
    clientConfig.entry,
  ]
  const clientCompiler = webpack(clientConfig)
  const clientDevMiddleware = devMiddleware(clientCompiler)
  clientCompiler.hooks.done.tap('client', () => {
    clientManifest = JSON.parse(
      clientDevMiddleware.context.outputFileSystem.readFileSync(
        resolve('../dist/vue-ssr-client-manifest.json'),
        'utf-8'
      )
    )
    update()
  })

  // 重要！！！将 clientDevMiddleware 挂载到 Express 服务中
  // 提供对其内部内存中数据的访问
  // 服务端通过内存操作 客户端通过http服务交互来获取
  service.use(clientDevMiddleware)
  service.use(hotMiddleware(clientCompiler))
  return onReady
}
