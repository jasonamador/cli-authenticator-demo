#!/usr/bin/env node

'use strict'

const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const term = require('terminal-kit').terminal
const db = require('level')('db')
const imageDataURI = require('image-data-uri')

const main = async function () {
  await initialize()
}

const initialize = async function () {
  let labels = []
  let keys = db.createKeyStream()
  keys.on('data', function (key) {
    labels.push(key)
  })
  keys.on('end', async function () {
    try {
      await termApp(labels)
    } catch(err) {
      term.red(`ERROR: ${err}\n`)
      process.exit(0)
    }
  })
}

const chooseSecret = async function (labels) {
  let items = ['Create New', ...labels]
  return await term.singleColumnMenu(items).promise
}

const mainMenu = async function() {
  term('OTPAUTH TEST APP\n')
  let items = ['CREATE NEW OTPAUTH SECRET', 'VERIFY OTP', 'INSPECT SECRET', 'QR CODE FROM URL']
  return await term.singleColumnMenu(items)
}

const termApp = async function (labels) {
  // initial menu
  let choice = await chooseSecret(labels)

  let secret, label, issuer

  if (choice.selectedIndex === 0) {
    // create a new secret
    term('Issuer: ')
    let _issuer = await term.inputField().promise
    term('\n')
    term('Name: ')
    label = await term.inputField().promise
    secret = speakeasy.generateSecret({length: 20, name: label})
    secret.otpauth_url += `&issuer=CLI%20Test`

    term.yellow(`otpauth url: ${secret.otpauth_url.replace('%20', ' ')}\n`)

    try {
      await db.put(label, JSON.stringify(secret))
      term.green(`\nPUT - ${label}: ${secret.base32}\n`)
      let imgUri = await QRCode.toDataURL(secret.otpauth_url, {scale: 2})
      let path = await imageDataURI.outputFile(imgUri, `./qrs/${label}.png`)
      await term.drawImage(path)
    } catch (err) {
      term.red(`ERROR: ${err}\n`)
      process.exit(0)
    }
  } else {
    // choose a secret
    label = choice.selectedText
    try {
      let _secret = await db.get(label)
      secret = JSON.parse(_secret)
      term.yellow(`otpauth url: ${secret.otpauth_url.replace('%20', ' ')}\n`)
    } catch (err) {
      term.red(`ERROR: ${err}\n`)
      process.exit(0)
    }
  }

  let token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32'
  })
  term(`TOTP: ${token}\n`)

  term(`Enter the TOTP for ${label}: `)
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
  process.exit(0)
}

main()
