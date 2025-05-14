import { asyncHandler } from "../../../utils/error/error.handler.js";
import { successResponse } from "../../../utils/successResponse/success.response.js";
import * as dbService from '../../../DB/db.service.js'
import userModel, { roleTypes } from "../../../DB/model/User.model.js";
import { emailEvent } from "../../../utils/events/email.event.js";
import { compareHash, generateHash } from "../../../utils/security/hash.js";
import { cloud } from "../../../utils/multer/cloudinary.multer.js";
import postModel from "../../../DB/model/Post.model.js";
import friendRequestModel from "../../../DB/model/FriendRequest.model.js";



export const sendFriendRequest = asyncHandler(async (req, res, next) => {
    const { friendId } = req.params
    const checkUser = await dbService.findOne({
        model: userModel,
        filter: {
            _id: friendId,
            isDeleted: { $exists: false }
        }
    })
    if (!checkUser) {
        return next(new Error("user not found", { cause: 404 }))
    }
    const friendRequest = await dbService.create({
        model: friendRequestModel,
        data: {
            friendId,
            createdBy: req.user._id
        }
    })

    return successResponse({ res, status: 201, data: { friendRequest } })
})


export const acceptFriendRequest = asyncHandler(async (req, res, next) => {
    const { friendRequestId } = req.params
    
    const friendRequest = await dbService.findOneAndDelete({
        model: friendRequestModel,
        filter: {
            _id: friendRequestId,
            status: false,
            friendId : req.user._id
        }
    })
    await dbService.updateOne({
        model : userModel,
        filter:{
            _id : req.user._id,
        },
        data:{
            $addToSet : {friends : friendRequest.createdBy}
        }
    })
    await dbService.updateOne({
        model : userModel,
        filter:{
            _id :friendRequest.createdBy,
        },
        data:{
            $addToSet : {friends : req.user._id}
        }
    })

    return successResponse({ res, status: 201, data: { friendRequest } })
})


export const dashboard = asyncHandler(async (req, res, next) => {

    const results = await Promise.allSettled([await dbService.find({
        model: postModel,
        filter: {},
    }), dbService.find({
        model: userModel,
        filter: {},
        populate: [{
            path: 'viewers.userId',
            select: "username image"
        }]
    })])


    return successResponse({ res, status: 200, data: { results } })
})

export const changeRoles = asyncHandler(async (req, res, next) => {

    const { userId } = req.params
    const { role } = req.body

    const roles = req.user.role === roleTypes.superAdmin ?
        { role: { $nin: [roleTypes.superAdmin] } } :
        { role: { $nin: [roleTypes.Admin, roleTypes.superAdmin] } }

    const user = await dbService.findOneAndUpdate({
        model: userModel,
        filter: {
            _id: userId,
            isDeleted: { $exists: false },
            ...roles
        },
        data: {
            role,
            updatedBy: req.user._id
        }
    })
    return successResponse({ res, status: 200, data: { user } })
})

export const profile = asyncHandler(async (req, res, next) => {
    const user = await dbService.findOne({
        model: userModel,
        filter: { _id: req.user._id },
        populate: [{
            path: 'viewers.userId friends',
            select: "username image"
        }]
    })
    return successResponse({ res, status: 200, data: { user } })
})

export const shareProfile = asyncHandler(async (req, res, next) => {
    const { profileId } = req.params
    let user = null

    if (profileId === req.user._id.toString()) {
        user = req.user
    } else {
        user = await dbService.findOneAndUpdate({
            model: userModel,
            filter: { _id: profileId, isDeleted: false },
            data: {
                $push: { viewers: { userId: req.user._id, time: Date.now() } }
            }, select: 'username image email'
        })
    }


    return user ? successResponse({ res, status: 200, data: { user } }) :
        next(new Error("in-valid account", { cause: 404 }))
})

export const updateEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.body
    if (await dbService.findOne({ model: userModel, filter: { email } })) {
        return next(new Error("email exist", { cause: 409 }))
    }
    await dbService.updateOne({ model: userModel, filter: { _id: req.user._id }, data: { tempEmail: email } })
    emailEvent.emit("sendConfirmEmail", { id: req.user._id, email: req.user.email, username: req.user.username })
    emailEvent.emit("updateEmail", { id: req.user._id, email, username: req.user.username })

    return successResponse({ res, status: 200, data: {} })
})

export const resetEmail = asyncHandler(async (req, res, next) => {
    const { oldCode, newCode } = req.body

    if (!compareHash({ plainText: oldCode, hashValue: req.user.confirmEmailOTP })
        ||
        !compareHash({ plainText: newCode, hashValue: req.user.tempEmailOTP })
    ) {
        return next(new Error("invalid provided code", { cause: 400 }))
    }

    await dbService.updateOne({
        model: userModel, filter: { _id: req.user._id },
        data: {
            email: req.user.tempEmail,
            changeCredentialTime: Date.now(),
            $unset: {
                tempEmail: 0,
                tempEmailOTP: 0,
                confirmEmailOTP: 0,

            }
        }

    })

    return successResponse({ res, status: 200, data: {} })
})

export const updatePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, password } = req.body


    if (!compareHash({ plainText: oldPassword, hashValue: req.user.password })) {
        return next(new Error("in valid old password", { cause: 400 }))
    }
    if (oldPassword === password) {
        return next(new Error("the password is the same", { cause: 409 }))
    }
    await dbService.updateOne({
        model: userModel, filter: { _id: req.user._id },
        data: {
            password: generateHash({ plainText: password, salt: process.env.SALT_ROUND }),
            changeCredentialTime: Date.now(),
        }

    })

    return successResponse({ res, status: 200, data: {} })
})

export const updateProfile = asyncHandler(async (req, res, next) => {
    const user = await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: req.user._id },
        data: req.body,
        options: { new: true }
    })
    return successResponse({ res, status: 200, data: { user } })
})

// images

export const updateProfileImage = asyncHandler(async (req, res, next) => {
    const { secure_url, public_id } = await cloud.uploader.upload(req.file.path,
        { folder: `${process.env.app_name}/user/${req.user._id}/profile` })

    const user = await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: req.user._id },
        data: { image: { secure_url, public_id } },
        options: { new: false }
    })
    if (user.image?.public_id) {
        await cloud.uploader.destroy(user.image.public_id)
    }

    return successResponse({ res, status: 200, data: { user } })
})

export const updateProfileCoverImage = asyncHandler(async (req, res, next) => {

    let images = []

    for (const file of req.files) {
        const { secure_url, public_id } = await cloud.uploader.upload(file.path,
            { folder: `${process.env.app_name}/user/${req.user._id}/profile` })
        images.push({ secure_url, public_id })
    }
    const user = await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: req.user._id },
        data: {
            coverImages: images
        },
        options: { new: true }
    })

    return successResponse({ res, status: 200, data: { user } })
})

// export const updateProfileIdentity = asyncHandler(async (req, res, next) => {


//     return successResponse({ res, status: 200, data: req.files })
// })

