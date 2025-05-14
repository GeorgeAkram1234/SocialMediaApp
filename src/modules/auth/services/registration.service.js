import userModel from "../../../DB/model/User.model.js";
import { asyncHandler } from "../../../utils/error/error.handler.js"
import { emailEvent } from "../../../utils/events/email.event.js";
import { compareHash, generateHash } from "../../../utils/security/hash.js";
import { successResponse } from "../../../utils/successResponse/success.response.js";
import * as dbServices from '../../../DB/db.service.js'

export const signup = asyncHandler(
    async (req, res, next) => {
        const { username, email, password } = req.body

        if (await dbServices.findOne({ model: userModel, filter: { email } })) {
            return next(new Error('email exist', { cause: 409 }))
        }
        const user = await dbServices.create({
            model: userModel,
            data: {
                username,
                email,
                password: generateHash({ plainText: password, salt: process.env.SALT_ROUND })
            }
        })
        emailEvent.emit('sendConfirmEmail', { email, username, id: user._id })


        return successResponse({ res, status: 201, data: { user }, message: "Signup" })
    }
)


export const confirmEmail = asyncHandler(
    async (req, res, next) => {
        const { email, code } = req.body
        const user = await dbServices.findOne({ model: userModel, filter: { email } })

        if (!user) {
            return next(new Error('not found user', { cause: 404 }))
        }
        if (user.confirmEmail) {
            return next(new Error('already verified', { cause: 409 }))
        }
        if (!compareHash({ plainText: code, hashValue: user.confirmEmailOTP })) {
            return next(new Error('in-valid code', { cause: 400 }))
        }
        await dbServices.updateOne({ model: userModel, filter: { email }, data: { confirmEmail: true, $unset: { confirmEmailOTP: 0 } } })

        return successResponse({ res, status: 200, data: { user }, message: "confirmed successfully" })
    }
)


