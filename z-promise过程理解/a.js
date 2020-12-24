// a 调用 b
const b = require('./b')

function foo() {
  console.log('foo')
}

const render = b(foo)

;(async function () {
  await render
  console.log(1)
})()
