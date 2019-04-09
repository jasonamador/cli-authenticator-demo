# cli-otpauth-utilities
This is a small collection of node apps for creating, verifying and inspecting otp secrets and qr codes. All of the scripts are executable from the terminal.  If your node binary exists somewhere other than `/usr/bin/env node` you can either change the first line of the script or run with `node ./<filename>`.  It can be handy if you are implementing 2fa in your app or just want to experiment with it.

### create-secret.js
This will let you create an optauth url and qr code, either by manually entering the base32 secret string or choosing to let the app generate it for you.  The secret object is saved in the local db (level db).

## inspect-secret.js
This allows you to select one of the saved secrets and view it's details.

## urltoqr.js
This just takes a string and converts it to a qr code.  If it is a valid otpauth url, you can scan it with Google Authenticator.

## verify-totp.js
This lets you choose one of the saved secrets or enter one manually, then enter a TOTP and validate.  It returns either 'Validated' or 'Not Validated'.

## index.js
***UNFINISHED, DO NOT USE*** 

This is meant to be a single app that has all of the functionality of the other scripts using a CLI menu interface.