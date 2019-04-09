#!/usr/bin/env node
'use strict'

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
  keys.unshift('MANUAL ENTRY')
  let choice = await term.singleColumnMenu(keys).promise
  let secret
  if (choice.selectedIndex === 0) {
    secret = {}
    // get all of the properties
    term.bold('ENTER BASE32 SECRET: ')
    secret.base32 = await term.inputField().promise
    term('\n')
  } else {
    try {
      let _secret = await db.get(choice.selectedText)
      secret = JSON.parse(_secret)
      secret.label = choice.selectedText
    } catch (err) {
      term.red(`ERROR: ${err}\n`)
      term.processExit(0)
    }
  }
  term(`Enter the TOTP for ${secret.base32}: `)
  let userToken = await term.inputField().promise
  let verified = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: userToken
  })
  if (verified) {
    term.green(`\nVerified!\n`)
  } else {
    term.red(`\nNot Verified!\n`)
  }
  term.processExit(0)
}

main()
