// Test server for receiving arbitrary JSON payload

const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 9000

app.post('/postJSON', function(req, res) {
  console.debug('postJSON body:', req.body)
  // res.send(req.body);
  res.end()
})

// start the server
app.listen(port);
console.debug('Server started! At http://localhost:' + port)
