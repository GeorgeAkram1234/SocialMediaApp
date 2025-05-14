import { EventEmitter } from "node:events";
import { customAlphabet } from 'nanoid'
import { confirmEmailTemplate } from "../email/template/confrimEmail.js";
import { sendEmail } from "../email/send.email.js";
import { generateHash } from "../security/hash.js";
import userModel from "../../DB/model/User.model.js";
import { resetPasswordTemplate } from "../email/template/resetPassword.js";
import * as dbServices from "../../DB/db.service.js";




export const emailEvent = new EventEmitter()

export const emailSubject = {
    confirmEmail: 'confirm-email',
    resetPassword: 'reset-password',
    updateEmail : 'update-email'
}

export const sendCode = async ({ data = {}, subject = emailSubject.confirmEmail } = {}) => {
    const { id, email, username } = data
    const otp = customAlphabet('0123456789', 4 )()
    const hashOTP = generateHash({ plainText: otp, salt: process.env.SALT_ROUND })
    let updateData = {}
    switch (subject) {
        case emailSubject.confirmEmail:
            updateData = { confirmEmailOTP: hashOTP }
            break;
        case emailSubject.resetPassword:
            updateData = { resetPasswordOTP: hashOTP }
        case emailSubject.updateEmail:
            updateData = { tempEmailOTP: hashOTP }
        default:
            break;
    }
    await dbServices.updateOne({ model: userModel, filter: { _id: id }, data: updateData })

    const html = subject == emailSubject.resetPassword ?
        resetPasswordTemplate({ code: otp })
        : confirmEmailTemplate({ code: otp, username })

    await sendEmail({ to: email, subject, html })
}


emailEvent.on("sendConfirmEmail", async (data) => {
    await sendCode({ data })
})

emailEvent.on("updateEmail", async (data) => {
    await sendCode({ data , subject : emailSubject.updateEmail })
})

emailEvent.on("forgetPassword", async (data) => {
    await sendCode({ data, subject: emailSubject.resetPassword })
})

