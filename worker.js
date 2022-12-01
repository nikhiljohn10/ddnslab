/*
Cloudflare DDNS Worker API
==========================
Author: Nikhil John


Method: POST
URL: https://ddnslab.tech/api/v1/
ContentType: application/json
Body: {
  apiToken: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  recordName: "The A Record name created for DDNS client",
  proxied: true/false
}

Example using CURL:

  $ curl -X POST "https://ddnslab.tech/api/v1/" -H "Content-Type: application/json" --data '{"apiToken":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","recordName":"home.example.com","proxied": true}'

Notes:
1. API Token is to be created in CloudFlare (My Profile > API Tokens > Create Token)
2. API Token permissions needed are Zone.Zone.Read & Zone.DNS.Edit
3. Note down the API Token somewhere safe after creation as there is no option to display it again
4. Use only HTTPS connection for security
5. Create the A record in the zone you need with as this code does not auto create new records.
6. Set proxied to false if you wish to access DDNS location with port which are not allowed by CloudFlare.

*/

const base = 'https://api.cloudflare.com/client/v4/'
const jsonType = 'application/json;charset=UTF-8'
const webpage = 'https://ddnslab.pages.dev'
const workerApi = 'https://ddnslab.nikz.in'

const errorRes = (message = "Invalid Request", code = 403) => {
  return new Response(message, { status: code })
}

const HTTPResponse = (data) => {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': jsonType } })
}

async function handleRequest(request) {

  const { pathname } = new URL(request.url)

  let userAgent = request.headers.get('User-Agent') || ''
  if (userAgent.includes('bot')) {
    return errorRes('Bots are not allowed', 403)
  }

  if (request.method === 'GET') {
    if (pathname === '/ip') {
      return HTTPResponse({ ip: request.headers.get('CF-Connecting-IP') });
    } else {
      const { pathname, search } = new URL(request.url);
      const destinationURL = webpage + pathname + search;
      const response = await fetch(destinationURL);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
      newResponse.headers.set('Access-Control-Allow-Origin', workerApi);
      return newResponse;
    }
  }

  if (request.method != 'POST') {
    return errorRes("Invalid method", 405)
  }

  if (request.headers.get('Content-Type') != 'application/json') {
    return errorRes("Invalid content type", 400)
  }

  let { apiToken, recordName, proxied } = await request.json()
  let zoneName = await getZonName(recordName)
  let result = await getZoneID(zoneName, apiToken)

  if (result.success) {
    let zoneID = result.zoneID
    let clientIP = request.headers.get('CF-Connecting-IP')
    result = await getRecordID(recordName, zoneID, apiToken)
    if (result.success) {
      let recordID = result.recordID
      result = await updateRecord(recordID, recordName, zoneID, clientIP, proxied, apiToken)
    } else {
      result = await createRecord(recordName, zoneID, clientIP, proxied, apiToken)
    }
  }
  return HTTPResponse(result)
}

async function getZoneID(zname, auth) {
  try {
    const url = base + 'zones?name=' + zname
    const init = {
      headers: {
        'content-type': jsonType,
        'authorization': 'Bearer ' + auth,
      },
    }
    const response = await fetch(url, init)
    const results = await response.json()
    if ((results.result).length) {
      return { "success": true, "zoneID": results.result[0].id }
    } else {
      return { "success": false, "error": "No zone found" }
    }
  } catch (err) {
    return { "success": false, "error": "No zone found" }
  }
}

async function getRecordID(rname, zid, auth) {
  try {
    const url = base + 'zones/' + zid + '/dns_records?name=' + rname
    const init = {
      headers: {
        'content-type': jsonType,
        'authorization': 'Bearer ' + auth,
      },
    }
    const response = await fetch(url, init)
    const results = await response.json()
    if ((results.result).length) {
      return { "success": true, "recordID": results.result[0].id }
    } else {
      return { "success": false, "error": "No record found" }
    }
  } catch (err) {
    return { "success": false, "error": "No record found" }
  }
}

async function updateRecord(rid, rname, zid, ip, px, auth) {
  try {
    const url = base + 'zones/' + zid + '/dns_records/' + rid
    const init = {
      body: JSON.stringify({
        "type": "A",
        "name": rname,
        "content": ip,
        "proxied": px
      }),
      method: 'PUT',
      headers: {
        'content-type': jsonType,
        'authorization': 'Bearer ' + auth,
      },
    }
    const response = await fetch(url, init)
    const results = await response.json()
    if (results.success) {
      return { "success": true, "message": "Record updated" }
    } else {
      return { "success": false, "error": "Unable to update record" }
    }
  } catch (err) {
    return { "success": false, "error": "Unable to update record" }
  }
}

async function createRecord(rname, zid, ip, px, auth) {
  try {
    const url = base + 'zones/' + zid + '/dns_records'
    const init = {
      body: JSON.stringify({
        "type": "A",
        "name": rname,
        "content": ip,
        "proxied": px
      }),
      method: 'POST',
      headers: {
        'content-type': jsonType,
        'authorization': 'Bearer ' + auth,
      },
    }
    const response = await fetch(url, init)
    const results = await response.json()
    if (results.success) {
      return { "success": true, "message": "Record created" }
    } else {
      return { "success": false, "error": "Unable to create record" }
    }
  } catch (err) {
    return { "success": false, "error": "Unable to create record" }
  }
}

async function getZonName(name) {
  const arr = name.split('.').reverse()
  while (arr.length > 2) {
    arr.pop()
  }
  return arr.reverse().join('.')
}

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request))
})
