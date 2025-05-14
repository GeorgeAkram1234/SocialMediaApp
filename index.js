import path from 'node:path'
import express from 'express'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve('./src/config/.env.dev') })
import { bootstrap } from './src/app.controller.js'
const app = express()
const port = process.env.PORT
import { runIo } from './src/modules/socket/socket.controller.js'


bootstrap(app, express)


const httpServer = app.listen(port, () => console.log(`Example app listening on port ${port}!`))

runIo(httpServer)