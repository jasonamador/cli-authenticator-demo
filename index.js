'use strict'

const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const term = require('terminal-kit').terminal
const clipboardy = require('clipboardy')
const db = require('level')('db')
const imageDataURI = require('image-data-uri')

const main = async function () {
  let names = []

  let keys = db.createKeyStream()
  keys.on('data', function (key) {
    names.push(key)
  })
  keys.on('end', async function () {
    await termApp(names)
    process.exit(0)
  })
}

const chooseKey = async function (names) {
  let items = ['Create New', ...names]

  return await term.singleColumnMenu(items).promise
}

const termApp = async function (names) {
  term('2FA TEST APP\n')
  // initial menu
  let choice = await chooseKey(names)

  let secret, name, secret32

  if (choice.selectedIndex === 0) {
    term('Name for Authenticator: ')
    name = await term.inputField().promise
    secret = speakeasy.generateSecret({length: 20, name})
    secret.otpauth_url += '&issuer=CLI%20Test'
    secret32 = secret.base32

    await db.put(name, secret32)
    term.green(`\nPUT - ${name}: ${secret32}\n`)
    let imgUri = await QRCode.toDataURL(secret.otpauth_url, {scale: 2})
    let path = await imageDataURI.outputFile(imgUri, `./qrs/${name}.png`)

    await term.drawImage(path)

    try {
      await clipboardy.write(imgUri)
      term('QRCode URI copied \n')
    } catch (err) {
      console.log(err)
    }
  } else {
    name = choice.selectedText
    secret32 = await db.get(name)
  }

  term(`Enter the 2fa code for ${name}: `)
  let userToken = await term.inputField().promise

  let verified = speakeasy.totp.verify({
    secret: secret32,
    encoding: 'base32',
    token: userToken
  })

  if (verified) {
    term.green(`\nVerified!\n`)
  } else {
    term.red(`\nNot Verified!\n`)
  }
  process.exit()
}

main()
