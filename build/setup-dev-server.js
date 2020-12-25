const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const webpack = require('webpack')

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
  serverCompiler.watch({}, (err, stats) => {
    // when in to callback 根据 serverConfig生成的文件
    // 已经创建好了

    // wepack配置问题
    if (err) throw err
    // 源代码问题
    if (stats.hasErrors()) return
    console.log('success')
    serverBundle = JSON.parse(
      fs.readFileSync(
        resolve('../dist/vue-ssr-server-bundle.json'),
        'utf-8'
      )
    )
    update()
  })

  return onReady
}
