const speakeasy = require('speakeasy')
const term = require('terminal-kit').terminal
const db = require('level')('db')

const main = async function () {
  await initialize()
}

const initialize = async function () {
  let keys = []
  let keyStream = db.createKeyStream()
  keyStream.on('data', function (key) {
    keys.push(key)
  })
  keyStream.on('end', async function () {
    if (keys.length === 0) {
      term.red('NO SECRETS FOUND\n')
      term.processExit(0)
    }
    try {
      await exec(keys)
    } catch(err) {
      term.red(`ERROR: ${err}\n`)
      term.processExit(0)
    }
  })
}

const exec = async function(keys) {
  let choice = await term.singleColumnMenu(keys).promise
  let secret
  try {
    let _secret = await db.get(choice.selectedText)
    secret = JSON.stringify(JSON.parse(_secret), null, 2);w
    secret.label = choice.selectedText
    term.green(secret)
  } catch (err) {
    term.red(`ERROR: ${err}\n`)
    term.processExit(0)
  }

  term.processExit(0)
}

main()
