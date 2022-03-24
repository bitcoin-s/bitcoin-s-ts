import fs from 'fs'
import http from 'http'
import https from 'http'
import path from 'path'

const axios = require('axios').default;

import { Request, Response } from 'express'

const URL = 'https://integrations.thndr.io/v0/dlc'
const ENDPOINT = 'integrations.thndr.io' // '127.0.0.1'
const PATH = '/v0/dlc' // '/postJSON'
const PORT = 443 // 9000

// Forwards incoming JSON body to arbitrary endpoint
exports.forward = async (req: Request, res: Response) => {
  const body = req.body
  console.debug('forward', body)

  const results = await axios.default({ 
    method: "POST",
    headers: {
      "x-api-key": "3a731e35-f49c-4598-aae9-6b5b2bcac993",
    },
    url: "https://integrations.thndr.io/v0/dlc",
    data: body,
  })

  // console.debug('results:', results)
  return

  // Worked fine to talk with local /postJSON backend but
  // did not like talking with THNDR GAMES over https for whatever reason

  const keyPath = path.join(__dirname, '../keys/key.pem')
  const certPath = path.join(__dirname, '../keys/cert.pem')
  // console.debug('keyPath:', keyPath, 'certPath:', certPath)
  const stringBody = JSON.stringify(body)
  const options /*: https.RequestOptions*/ = {
    // protocol: 'https:',
    host: ENDPOINT,
    // hostname: ENDPOINT,
    // port: PORT,
    path: PATH,
    method: 'POST', // 'GET', // 
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': stringBody.length, // Buffer.byteLength(stringBody),
      'x-api-key': '18c72225-d26e-4aa5-8257-6fabfcd266a1',
      // testing
      // 'Host': 'integrations.thndr.io',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Host': 'www.thndr.io',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'PostmanRuntime/7.28.4',
      'connection': 'keep-alive',
      // 'random': Math.random.toString()
    },
    // agent: false,
    // key: fs.readFileSync(keyPath),
    // cert: fs.readFileSync(certPath),
  }
  // const agentOptions /*: https.AgentOptions*/ = {
  //   host: ENDPOINT,
  //   port: PORT,
  // }
  // const agent = new https.Agent(options);
  // (<any>options).agent = agent;

  // URL, 
  const request = https.request(options, function (res) {
  // const request = http.request(options, function (res) {
    console.debug('statusCode:', res.statusCode);
    console.debug('headers:', res.headers);
    res.setEncoding('utf8');

    let body = '';

    res.on('data', function (chunk) {
      body = body + chunk;
    });

    res.on('end',function(){
      console.debug("Body: " + body);
      // if (res.statusCode !== 200) {
      //   console.error("Api call failed with response code " + res.statusCode);
      // } else {
      //   // callback(null);
      // }
    });

  })
  request.on('error', function (err) {
    console.error('Error: ', err)
  })
  request.write(stringBody)
  request.end()
  // res.end()
}
