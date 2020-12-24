const chokidar = require('chokidar')

module.exports = function(callback) {
  let ready
  const onReady = new Promise(r => (ready = r))

  const update = () => {
    ready()
    callback()
  }

  // chokidar.watch('./input').on('change', () => {
  //   update()
  // })

  // foo
  // 1

  setInterval(() => {
    update()
  }, 1000)

  // foo
  // 1
  // foo
  // foo
  // foo
  // foo
  // foo
  return onReady
}
