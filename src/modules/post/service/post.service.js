import { asyncHandler } from "../../../utils/error/error.handler.js";
import { cloud } from "../../../utils/multer/cloudinary.multer.js";
import * as dbService from '../../../DB/db.service.js'
import postModel from "../../../DB/model/Post.model.js";
import { successResponse } from "../../../utils/successResponse/success.response.js";
import { roleTypes } from "../../../DB/model/User.model.js";
import { paginate } from "../../../utils/pagination.js";


export const getAllPosts = asyncHandler(async (req, res, next) => {

    let { page, size } = req.query

    const data = await paginate({
        page,
        size,
        model: postModel,
        filter: {
            isDeleted: { $exists: false }
        },
        populate: [
            {
                path: 'comments',
                match: { isDeleted: { $exists: false }, commentId: { $exists: false } },
                populate: [{
                    path: 'reply',
                    match: { isDeleted: { $exists: false } },
                }]
            }
        ]
    })

    return successResponse({ res, status: 200, data, message: "Posts" })
})

export const createPost = asyncHandler(async (req, res, next) => {
    const { content  } = req.body
    let attachments = []
    for (const file of req.files) {
        const { secure_url, public_id } = await cloud.uploader.upload(file.path, { folder: `${process.env.app_name}/post` })
        attachments.push({ secure_url, public_id })
    }
    
    console.log(attachments);
    
    const post = await dbService.create({
        model: postModel,
        data: {
            content,
            attachments,
            createdBy: req.user._id
        }

    })

    return successResponse({ res, status: 201, data: { post }, message: "Post Created" })
})

export const updatePost = asyncHandler(async (req, res, next) => {
    let attachments = []
    if (req.files.length) {
        for (const file of req.files) {
            const { secure_url, public_id } = await cloud.uploader.upload(file.path, { folder: `${process.env.app_name}/post` })
            attachments.push({ secure_url, public_id })
        }
        req.body.attachments = attachments
    }

    const post = await dbService.findOneAndUpdate({
        model: postModel,
        filter: { _id: req.params.postId, createdBy: req.user._id, isDeleted: { $exists: false } },
        data: {
            ...req.body,
            updatedBy: req.user._id
        },
        options: { new: true }

    })

    return post ? successResponse({ res, status: 200, data: { post }, message: "Post updated" }) :
        next(new Error("post not found", { cause: 404 }))
})

// freeze Post

export const freezePost = asyncHandler(async (req, res, next) => {


    const owner = req.user.role === roleTypes.Admin ? {} : { createdBy: req.user._id }

    const post = await dbService.findOneAndUpdate({
        model: postModel,
        filter: {
            _id: req.params.postId,
            isDeleted: { $exists: false },
            ...owner
        },
        data: {
            isDeleted: true,
            updatedBy: req.user._id,
            deletedBy: req.user._id
        },
        options: { new: true }

    })

    return post ? successResponse({ res, status: 200, data: { post }, message: "Post deleted" }) :
        next(new Error("post not found", { cause: 404 }))
})

export const unfreezePost = asyncHandler(async (req, res, next) => {
    const post = await dbService.findOneAndUpdate({
        model: postModel,
        filter: {
            _id: req.params.postId,
            isDeleted: { $exists: true },
            deletedBy: req.user._id
        },
        data: {
            $unset: {
                isDeleted: 0,
                deletedBy: 0
            },
            updatedBy: req.user._id,
        },
        options: { new: true }

    })

    return post ? successResponse({ res, status: 200, data: { post }, message: "Post restored" }) :
        next(new Error("post not found", { cause: 404 }))
})

// likes & unlikes on posts

export const likePost = asyncHandler(async (req, res, next) => {

    const data = req.query.action === 'unLike' ?
        { $pull: { likes: req.user._id } } :
        { $addToSet: { likes: req.user._id } }
    const post = await dbService.findOneAndUpdate({
        model: postModel,
        filter: {
            _id: req.params.postId,
            isDeleted: { $exists: false },
        },
        data,
        options: { new: true }

    })

    return post ? successResponse({
        res, status: 200,
        data: { post },
        message: { like: req.query.action === 'unLike' ? 'post unliked' : 'post liked' }
    }) :
        next(new Error("post not found", { cause: 404 }))
})