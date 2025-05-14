import { asyncHandler } from "../../../utils/error/error.handler.js";
import { successResponse } from "../../../utils/successResponse/success.response.js";
import * as dbService from '../../../DB/db.service.js'
import postModel from "../../../DB/model/Post.model.js";
import { cloud } from "../../../utils/multer/cloudinary.multer.js";
import commentModel from "../../../DB/model/Comment.model.js";
import { roleTypes } from "../../../DB/model/User.model.js";


export const createComment = asyncHandler(async (req, res, next) => {
    const { postId, commentId } = req.params

    if (commentId && ! await dbService.findOne({
        model: commentModel,
        filter: { _id: commentId, postId, isDeleted: { $exists: false } }
    })) {
        return next(new Error('in-valid parent Comment', { cause: 404 }))

    }

    const post = await dbService.findOne({
        model: postModel,
        filter: { _id: postId, isDeleted: { $exists: false } }
    })
    if (!post) {
        return next(new Error('in-valid post Id', { cause: 404 }))
    }
    if (req.files?.length) {
        const attachments = []
        for (const file of req.files) {
            const { secure_url, public_id } = await cloud.uploader.upload(file.path, {
                folder: `${process.env.app_name}/user/${post.createdBy}/post/${postId}/comment`
            })
            attachments.push({ secure_url, public_id })
        }
        req.body.attachments = attachments
    }

    const comment = await dbService.create({
        model: commentModel,
        data: {
            ...req.body,
            postId,
            commentId,
            createdBy: req.user._id
        }
    })


    return successResponse({ res, status: 201, data: { comment }, message: "done" })
})

export const updateComment = asyncHandler(async (req, res, next) => {
    const { postId, commentId } = req.params

    const comment = await dbService.findOne({
        model: commentModel,
        filter: { _id: commentId, postId, createdBy: req.user._id, isDeleted: { $exists: false } },
        populate: [{ path: "postId" }]
    })
    if (!comment || comment.postId.isDeleted) {
        return next(new Error('in-valid comment Id', { cause: 404 }))
    }
    if (req.files?.length) {
        const attachments = []
        for (const file of req.files) {
            const { secure_url, public_id } = await cloud.uploader.upload(file.path, {
                folder: `${process.env.app_name}/user/${post.createdBy}/post/${postId}/comment`
            })
            attachments.push({ secure_url, public_id })
        }
        req.body.attachments = attachments
    }

    const savedComment = await dbService.findOneAndUpdate({
        model: commentModel,
        filter: {
            _id: commentId,
            postId,
            createdBy: req.user._id,
            isDeleted: { $exists: false }
        },
        data: {
            ...req.body

        },
        options: { new: true }
    })


    return successResponse({ res, status: 200, data: { comment: savedComment } })
})

export const freezeComment = asyncHandler(async (req, res, next) => {
    const { postId, commentId } = req.params

    const comment = await dbService.findOne({
        model: commentModel,
        filter: { _id: commentId, postId, createdBy: req.user._id, isDeleted: { $exists: false } },
        populate: [{ path: "postId" }]
    })
    if (
        !comment
        ||
        (comment.createdBy.toString() != req.user._id.toString()
            &&
            comment.postId.toString() != req.user._id.toString()
            &&
            req.user.role != roleTypes.Admin)
    ) {
        return next(new Error('in-valid comment Id or not auth used', { cause: 404 }))
    }

    const savedComment = await dbService.findOneAndUpdate({
        model: commentModel,
        filter: {
            _id: commentId,
            postId,
            isDeleted: { $exists: false }
        },
        data: {
            isDeleted: Date.now(),
            deletedBy: req.user._id
        },
        options: { new: true }
    })


    return successResponse({ res, status: 200, data: { comment: savedComment } })
})

export const unfreezeComment = asyncHandler(async (req, res, next) => {
    const { postId, commentId } = req.params

    const savedComment = await dbService.findOneAndUpdate({
        model: commentModel,
        filter: {
            _id: commentId,
            postId,
            deletedBy: req.user._id,
            isDeleted: { $exists: true }
        },
        data: {
            $unset: {
                isDeleted: 0,
                deletedBy: 0,
            },
            updatedBy: req.user._id
        },
        options: { new: true }
    })


    return successResponse({ res, status: 200, data: { comment: savedComment } })
})

