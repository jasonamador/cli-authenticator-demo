const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const term = require('terminal-kit').terminal
const db = require('level')('db')
const imageDataURI = require('image-data-uri')
const encode = require('urlencode')

const main = async function () {
  term.bold.underline('CREATE NEW SECRET\n\n')

  term.bold('ISSUER: ')
  let issuer = await term.inputField().promise
  term('\n')

  term.bold('LABEL: ')
  let label = await term.inputField().promise
  term('\n')

  term.bold.underline('SECRET\n')
  let genChoice = await term.singleColumnMenu(['AUTO-GENERATE', 'MANUAL ENTRY']).promise

  let secret
  if (genChoice.selectedIndex === 0) {
    secret = speakeasy.generateSecret({length: 20, name: label})
  } else {
    term.bold('ENTER BASE32 SECRET: ')
    let secret32 = await term.inputField().promise
    term('\n')
    secret = {base32: secret32, otpauth_url: `otpauth://totp/${label}?secret=${secret32}`}
  }
  secret.otpauth_url += `&issuer=${encode(issuer)}`

  try {
    let imgUri = await QRCode.toDataURL(secret.otpauth_url, {scale: 2})
    let path = await imageDataURI.outputFile(imgUri, `./qrs/${label}.png`)
    await term.drawImage(path)
    await db.put(label, JSON.stringify(secret))
    term.green(`\nPUT - ${label}:\n${JSON.stringify(secret, null, 2)}\n`)
    // term.yellow(`OTPAUTH URL: ${secret.otpauth_url}\n`)
  } catch (err) {
    term.red(`ERROR: ${err}\n`)
    term.processExit(0)
  }
  term.processExit(0)
}

main()
