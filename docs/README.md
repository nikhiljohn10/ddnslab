# Cloudflare DDNS Worker API

**Author: Nikhil John [(@nikhiljohn10 / @nikzjon)](https://github.com/nikhiljohn10)**


### Prerequisite

- Owns a Domain Name which uses CLoudFlare (eg: example.com).
- Cloudflare API Token created with Zone.Zone.Read & Zone.DNS.Edit permissions.


### Usage

**HTTPS Request**
```
Method: POST
URL: https://cf.ddnslab.tech
ContentType: application/json
Body: {
  apiToken: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  recordName: "The A Record name created for DDNS client",
  proxied: true/false
}
```
Example using CURL for Linux Terminal:
```
curl -X POST "https://cf.ddnslab.tech" -H "Content-Type: application/json" --data '{"apiToken":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","recordName":"home.example.com","proxied": true}'
```

Example using Node.JS for Linux Users:
```
const https = require('https')

const data = JSON.stringify({
  "apiToken":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "recordName":"home.example.com",
  "proxied": true 
})

const options = {
  hostname: 'cf.ddnslab.tech',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}

const req = https.request(options, (res) => {
  res.on('data', (d) => {
    process.stdout.write(d)
  })
})

req.on('error', (error) => {
  console.error(error)
})

req.write(data)
req.end()
```

Example using Batch File for Windows Users:
```
@echo off

title CloudFlare DDNS Service
echo Initiating service...
:loop
curl https://cf.ddnslab.tech/ -H Content-Type:application/json --data "{\"apiToken\":\"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\",\"recordName\":\"home.example.com\",\"proxied\":true}"
echo ^: %date% %time%
timeout /t 60 /nobreak > NUL
goto loop
pause
```


**Notes:**
1. API Token is to be created in CloudFlare (My Profile > API Tokens > Create Token)
2. API Token permissions needed are Zone.Zone.Read & Zone.DNS.Edit
3. Note down the API Token somewhere safe after creation as there is no option to display it again
4. Use only HTTPS protocol for security reason.
5. Set proxied to false if you wish to access DDNS location with port which are not allowed by CloudFlare.


### References

[CloudFlare API Documentation](https://api.cloudflare.com)

[DDNS Worker Code](https://github.com/jwala-diamonds/ddnslab.tech/blob/master/worker.js)

[CloudFlare Worker Documentation](https://developers.cloudflare.com/workers/)