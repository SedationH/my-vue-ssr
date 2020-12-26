## [Vue SSR](https://ssr.vuejs.org/#what-is-server-side-rendering-ssr)

nuxt已经封装了这个的使用

简单说下设计逻辑，首屏渲染通过服务器的node环境，之后页面的交互被客户端的js接管(客户端激活)。

> Vue.js is a framework for building client-side applications. By default, Vue components produce and manipulate DOM in the browser as output. However, it is also possible to render the same components into HTML strings on the server, send them directly to the browser, and finally "hydrate" the static markup into a fully interactive app on the client.
>
> A server-rendered Vue.js app can also be considered "isomorphic" or "universal", in the sense that the majority of your app's code runs on both the server **and** the client.



接下来就是跟着文档走了



尝试自己搞个ssr开发环境，主要提一下开发配置

| webpack                                                      | webpack 核心包                         |
| ------------------------------------------------------------ | -------------------------------------- |
| webpack-cli                                                  | webpack 的命令行工具                   |
| webpack-merge                                                | webpack 配置信息合并工具               |
| webpack-node-externals                                       | 排除 webpack 中的 Node 模块            |
| rimraf                                                       | 基于 Node 封装的一个跨平台 rm -rf 工具 |
| friendly-errors-webpack-plugin                               | 友好的 webpack 错误提示                |
| @babel/core   @babel/plugin-transform-runtime   @babel/preset-env   babel-loader | Babel 相关工具                         |
| vue-loader   vue-template-compiler                           | 处理 .vue 资源                         |
| file-loader                                                  | 处理字体资源                           |
| css-loader                                                   | 处理 CSS 资源                          |
| url-loader                                                   | 处理图片资源                           |



有个坑 webpack别上5 默认走5了



还有好多细节看git log吧

```zsh
commit d319d744d79459401d0842e40304f7b38792c417 (HEAD -> master)
Author: SedationH <sedationh@gmail.com>
Date:   Thu Dec 24 09:02:42 2020 +0800

    ⚡️ integrate webpack with vue-server-renderer

commit f45e52da5feed4fd0ee42972bcf141c520cbd378
Author: SedationH <sedationh@gmail.com>
Date:   Thu Dec 24 08:39:27 2020 +0800

    ⚡️ git strat with ssr
```



**接下来是搞自动构建和热更新**

所谓自动构建，就是检测到文件变动，自动走打包和重新渲染流程，另外浏览器也自动刷新一下。

搭配热更新实现局部替换，优化开发体验。



chokidar来封装文件变动处理

利用webpack-dev-middleware 可以把频繁读写的文件搞到磁盘里进行调用

注意版本有变动

https://github.com/webpack/webpack-dev-middleware/issues/766

在webpack.server.config.js中 add

```js
module.exports = {
  //...
  infrastructureLogging: {
    level: 'info'
  }
};
```



```js
serverCompiler.hooks.done.tap('server', () => {
  serverBundle = JSON.parse(
    serverCompilerDevMiddleware.context.outputFileSystem.readFileSync(
      resolve('../dist/vue-ssr-server-bundle.json'),
      'utf-8'
    )
  )
  update()
})
```

serverCompilerDevMiddleware 的api有变化 看runtime来找一下



再搞下热更新 这里没啥坑



编写通用环境的注意事项

https://ssr.vuejs.org/guide/universal.html#data-reactivity-on-the-server



配置vue router对ssr的适配

https://ssr.vuejs.org/guide/routing.html#routing-with-vue-router



对组件异步导入的理解

```js
routes: [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/pages/About'),
  },
  {
    path: '/posts',
    name: 'post-list',
    component: () => import('@/pages/Posts'),
  },
  {
    path: '*',
    name: '404',
    component: () => import('@/pages/404'),
  },
],
})
```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="description" content="ssr demo" />

    <link
      rel="preload"
      href="/dist/server-bundle.js"
      as="script"
    />
    <link rel="prefetch" href="/dist/0.server-bundle.js" />
    <link rel="prefetch" href="/dist/1.server-bundle.js" />
    <link rel="prefetch" href="/dist/2.server-bundle.js" />
  </head>

  <title>SedationH</title>
  <body>
    <div id="app" data-server-rendered="true">
      <ul>
        <li>
          <a
            href="/"
            aria-current="page"
            class="router-link-exact-active router-link-active"
            >Home</a
          >
        </li>
        <li><a href="/about">About</a></li>
        <li><a href="/posts">Posts</a></li>
        <li><a href="/xxxx">404</a></li>
      </ul>
      <div><h1>Home Page</h1></div>
    </div>
    <script src="/dist/server-bundle.js" defer></script>
  </body>
</html>

```



preload -> 预加载 不阻塞

prefetch -> 预请求 不稳定 当浏览器空闲时

![image-20201226160414808](http://picbed.sedationh.cn/image-20201226160414808.png)



`<link rel="prefetch">` has been supported in browsers for a long time, but it is intended for prefetching resources that will be used in the ***next\*** navigation/page load (e.g. when you go to the next page). This is fine, but isn't useful for the current page! In addition, browsers will give `prefetch` resources a lower priority than `preload` ones — the current page is more important than the next. See [Link prefetching FAQ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ) for more details.