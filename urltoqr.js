const QRCode = require('qrcode')
const term = require('terminal-kit').terminal
const imageDataURI = require('image-data-uri')

const main = async function() {
  term('GET QR FROM URL\n\n')
  let url = await term.inputField().promise
  let imgUri = await QRCode.toDataURL(url, {scale: 2})
  let path = await imageDataURI.outputFile(imgUri, `./qrs/temp.png`)
  await term.drawImage(path)
  term.processExit(0)
}

main()
