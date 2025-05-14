import connectDB from "./DB/connection.js"
import authController from './modules/auth/auth.controller.js'
import userController from './modules/user/user.controller.js'
import postController from './modules/post/post.controller.js'
import chatController from './modules/chat/chat.controller.js'
import { globalErrorHandling } from "./utils/error/error.handler.js"
import path from 'node:path';
import cors from 'cors'
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import playground from 'graphql-playground-middleware-express'
import { createHandler } from "graphql-http/lib/use/express"
import { schema } from "./modules/app.graph.js"



const limiter = rateLimit({
    limit: 5,
    windowMs: 2 * 60 * 1000,
    message: { error: "rate limit reached" },
    statusCode: 429,
    handler: (req, res, next) => {
        return next(new Error("game over", { cause: 429 }))
    },
    legacyHeaders: false,
    standardHeaders: 'draft-8'
})

const postLimiter = rateLimit({
    limit: 2,
    windowMs: 2 * 60 * 1000
})



export const bootstrap = (app, express) => {


    // app.use(limiter)
    // app.use('/post', postLimiter)
    app.use(helmet())
    app.use(cors())
    app.use(express.json())
    app.use('/uploads', express.static(path.resolve('./src/uploads')))

    //graphQl

    app.get('/playground', playground.default({ endpoint: '/graphql' }))
    app.use('/graphql', createHandler({ schema : schema }))


    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "Welcome to our social media app" })
    })

    app.use("/auth", authController)
    app.use("/user", userController)
    app.use("/post", postController)
    app.use("/chat", chatController)

    app.all("*", (req, res, next) => {
        return res.status(404).json({ message: "In-valid routing" })
    })

    //error handler
    app.use(globalErrorHandling)


    //DB connection
    connectDB()


}