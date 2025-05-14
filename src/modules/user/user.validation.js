import joi from 'joi'
import { generalFields } from '../../middleware/validation.middleware.js'



export const profileImage = joi.object().keys({
    file: generalFields.file.required()
}).required()


export const shareProfile = joi.object().keys({
    profileId: generalFields.id.required()
}).required()


export const updateEmail = joi.object().keys({
    email: generalFields.email.required()
}).required()

export const resetEmail = joi.object().keys({
    oldCode: generalFields.code.required(),
    newCode: generalFields.code.required()
}).required()


export const updatePassword = joi.object().keys({
    oldPassword: generalFields.password.required(),
    password: generalFields.password.required(),
    confirmationPassword: generalFields.confirmationPassword.valid(joi.ref("password")).required()
}).required()

export const updateProfile = joi.object().keys({
    username: generalFields.username,
    DOB: generalFields.DOB,
    gender: generalFields.gender,
    phone: generalFields.phone,
    address: generalFields.address
}).required()

