import { compareHash, generateHash } from "../../../utils/security/hash.js"
import userModel, { providerTypes, roleTypes } from "../../../DB/model/User.model.js";
import { asyncHandler } from "../../../utils/error/error.handler.js"
import { successResponse } from "../../../utils/successResponse/success.response.js";
import { generateToken, decodedToken, tokenTypes } from "../../../utils/security/token.js";
import { emailEvent } from "../../../utils/events/email.event.js";
import { OAuth2Client } from 'google-auth-library';
import * as dbServices from "../../../DB/db.service.js";

//login

export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body
    const user = await dbServices.findOne({ model: userModel, filter: { email, provider: providerTypes.system } })

    if (!user) {
        return next(new Error('in valid account', { cause: 404 }))
    }

    if (!user.confirmEmail) {
        return next(new Error('verify your account first', { cause: 400 }))
    }

    if (!compareHash({ plainText: password, hashValue: user.password })) {
        return next(new Error('in-valid credentials', { cause: 404 }))
    }
    
    const access_token = generateToken({
        payload: { id: user._id },
        signature: [roleTypes.Admin, roleTypes.superAdmin].includes(user.role) ?
            process.env.ADMIN_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
        options: { expiresIn: 18000000 }
    })
    const refresh_token = generateToken({
        payload: { id: user._id },
        signature: [roleTypes.Admin, roleTypes.superAdmin].includes(user.role) ?
            process.env.ADMIN_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
        options: { expiresIn: 31536000 }
    })

    return successResponse({ res, status: 200, data: { token: { access_token, refresh_token } }, message: "login" })
}
)

export const loginWithGmail = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body


    const client = new OAuth2Client();
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return payload
    }
    const payload = await verify()

    if (!payload.email_verified) {
        return next(new Error('in valid account', { cause: 400 }))
    }

    let user = await dbServices.findOne({ model: userModel, filter: { email: payload.email } })
    if (!user) {
        user = await dbServices.create({
            model: userModel,
            data: {
                username: payload.name,
                email: payload.email,
                confirmEmail: payload.email_verified,
                image: payload.picture,
                provider: providerTypes.google
            }
        })
    }

    if (user.provider != providerTypes.google) {
        return next(new Error('in valid provider', { cause: 400 }))
    }


    const access_token = generateToken({
        payload: { id: user._id },
        signature: [roleTypes.Admin, roleTypes.superAdmin].includes(user.role) ?
            process.env.ADMIN_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
        options: { expiresIn: 1800000000 }
    })
    const refresh_token = generateToken({
        payload: { id: user._id },
        signature: [roleTypes.Admin, roleTypes.superAdmin].includes(user.role) ?
            process.env.ADMIN_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
        options: { expiresIn: 31536000 }
    })

    return successResponse({
        res,
        status: 200,
        data: { token: { access_token, refresh_token } },
        message: "login"
    })
}
)

export const refreshToken = asyncHandler(async (req, res, next) => {
    const { authorization } = req.headers
    const user = await decodedToken({ authorization, tokenType: tokenTypes.refresh, next })

    const access_token = generateToken({
        payload: { id: user._id },
        signature: [roleTypes.Admin, roleTypes.superAdmin].includes(user.role) ?
            process.env.ADMIN_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN,
        options: { expiresIn: 1800 }
    })
    const refresh_token = generateToken({
        payload: { id: user._id },
        signature: [roleTypes.Admin, roleTypes.superAdmin].includes(user.role) ?
            process.env.ADMIN_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN,
        options: { expiresIn: 31536000 }
    })

    return successResponse({
        res,
        status: 200,
        data: { token: { access_token, refresh_token } },
        message: "refresh Token"
    })
})


// forget password

export const forgetPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body

    const user = await dbServices.findOne({ model: userModel, filter: { email, isDeleted: false } })
    if (!user) {
        return next(new Error("not registered account", { cause: 404 }))
    }
    if (!user.confirmEmail) {
        return next(new Error("confirm your email first", { cause: 400 }))
    }
    emailEvent.emit('forgetPassword', { id: user._id, email, username: user.username })
    return successResponse({ res, status: 200, data: { msg: 'check your email' }, message: "forget password" })

})

export const validateForgetPassword = asyncHandler(async (req, res, next) => {
    const { email, code } = req.body

    const user = await dbServices.findOne({ model: userModel, filter: { email, isDeleted: false } })
    if (!user) {
        return next(new Error("not registered account", { cause: 404 }))
    }
    if (!user.confirmEmail) {
        return next(new Error("confirm your email first", { cause: 400 }))
    }
    if (!compareHash({ plainText: code, hashValue: user.resetPasswordOTP })) {
        return next(new Error("Wrong code", { cause: 400 }))
    }
    return successResponse({ res, status: 200, data: { msg: 'done' }, message: "validate forget password" })

})

export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, code, password } = req.body

    const user = await dbServices.findOne({ model: userModel, filter: { email, isDeleted: false } })

    if (!user) {
        return next(new Error("not registered account", { cause: 404 }))
    }
    if (!user.confirmEmail) {
        return next(new Error("confirm your email first", { cause: 400 }))
    }
    if (!compareHash({ plainText: code, hashValue: user.resetPasswordOTP })) {
        return next(new Error("Wrong code", { cause: 400 }))
    }

    await dbServices.updateOne({
        model: userModel,
        filter: { email },
        data: {
            password: generateHash({ plainText: password }),
            changeCredentialTime: Date.now(),
            $unset: {
                resetPasswordOTP: 0
            }
        }
    })
    return successResponse({ res, status: 200, data: { msg: 'done' }, message: "validate forget password" })

})