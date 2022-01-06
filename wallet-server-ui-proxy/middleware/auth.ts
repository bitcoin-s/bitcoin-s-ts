import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { BodyRequest } from 'common-ts/lib/util/express-util'
import { get64randomBytes } from 'common-ts/lib/util/string-util'


// Note: Any of this could be externalized to a config file / env vars

const ALGORITHM = 'HS256'

const ACCESS_TOKEN_LIFE = '70s' // process.env.ACCESS_TOKEN_LIFE
const ACCESS_TOKEN_LIFE_MS = 70000 // must match ACCESS_TOKEN_LIFE, in ms
const REFRESH_TOKEN_LIFE = '4m' // process.env.REFRESH_TOKEN_LIFE

// TOKEN_SECRETs don't live past server restarts
const ACCESS_TOKEN_SECRET = get64randomBytes() // process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = get64randomBytes() // process.env.REFRESH_TOKEN_SECRET

const DEFAULT_USER = 'frontend'
const DEFAULT_PASSWORD = 'none'

// Set frontend password - does not persist locally
const users = [{
  user: DEFAULT_USER,
  password: process.env.DEFAULT_UI_PASSWORD || DEFAULT_PASSWORD,
}]
// const encryptedPassword = await bcrypt.hash(password, 10);

let refreshTokens = []

// create the access token with the shorter lifespan
function generateAccessToken(payload: any) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: ACCESS_TOKEN_LIFE
  })
}
// create the refresh token with the longer lifespan
function generateRefreshToken(payload: any) {
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: REFRESH_TOKEN_LIFE
  })
  refreshTokens.push(refreshToken)
  return refreshToken
}

/** Request Types */

interface LoginRequest {
  user: string
  password: string
}
interface RefreshRequest {
  user: string
  refreshToken: string
}
interface LogoutRequest {
  refreshToken: string
}

exports.login = function(req: BodyRequest<LoginRequest>, res: Response) {
  // console.debug('/login', req.body)
  const username = req.body.user
  const password = req.body.password
  if (username !== undefined && password !== undefined) {
    // check to see if the user exists in the list of registered users
    const user = users.find(u => u.user === username)
    // console.debug('user:', user, 'password:', password, user.password !== password)
    // if user does not exist, send a 400 response
    if (user === undefined) res.status(404).send("User does not exist")
    // if (await bcrypt.compare(req.body.password, user.password)) {
    if (user.password === password) {
      res.json({ 
        accessToken: generateAccessToken({ user: username }),
        refreshToken: generateRefreshToken({ user: username }),
        expiresIn: ACCESS_TOKEN_LIFE_MS,
      })
    } else {
      res.status(401).send("Incorrect Password")
    }
  } else {
    res.status(400).send("Missing Request Fields")
  }
}

exports.verify = function(req: Request, res: Response, next) {
  // get token from request header
  const authHeader = req.headers["authorization"]
  if (authHeader) {
    // the request header contains the token "Bearer <token>", split the string and use the second value in the split array.
    const token = authHeader.split(" ")[1]

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) { 
        res.status(403).send("Access Token Invalid")
      } else {
        // req.user = payload
        next() // proceed to the next action in the calling function
      }
    }) //end of jwt.verify()
  } else {
    res.status(401).send("No Authorization Header")
  }
}

exports.refresh = function (req: BodyRequest<RefreshRequest>, res: Response) {
  // console.debug('/refresh', req.body)
  const username = req.body.user
  const token = req.body.refreshToken

  if (username !== undefined && token !== undefined) {
    if (!refreshTokens.includes(token)) {
      res.status(400).send("Refresh Token Invalid")
    } else {
      // remove the old refreshToken from the refreshTokens list
      refreshTokens = refreshTokens.filter(c => c !== token)
      // generate new accessToken and refreshTokens
      res.json({ 
        accessToken: generateAccessToken({ user: username }), 
        refreshToken: generateRefreshToken({ user: username }),
        expiresIn: ACCESS_TOKEN_LIFE_MS,
      })
    }
  } else {
    res.status(400).send("Missing Request Fields")
  }
}

exports.logout = function (req: BodyRequest<LogoutRequest>, res: Response) {
  // console.debug('/logout', req.body)
  const token = req.body.refreshToken

  if (token !== undefined) {
    // remove the old refreshToken from the refreshTokens list
    refreshTokens = refreshTokens.filter(c => c !== token)
    res.status(204).send("Logged Out")
  } else {
    res.status(400).send("Missing Request Fields")
  }
}

exports.test = function(req: Request, res: Response) {
  // console.debug('/test', req.body)
  res.json({ success: true })
}
