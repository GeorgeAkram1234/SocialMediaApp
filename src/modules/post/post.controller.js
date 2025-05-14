import { Router } from "express";
import commentController from '../comment/comment.controller.js'
import * as postService from './service/post.service.js'
import * as validators from './post.validation.js'
import { validation } from "../../middleware/validation.middleware.js";
import { authentication , authorization } from "../../middleware/auth.middleware.js";
import { endpoint } from './post.authorization.js'
import { fileValidations, uploadCloudFile } from "../../utils/multer/cloud.multer.js";

const router = Router()

router.use('/:postId/comment' , commentController)


router.get('/',
    authentication(),
    postService.getAllPosts
)

router.post('/',
    authentication(),
    authorization(endpoint.createPost),
    uploadCloudFile(fileValidations.image).array('attachment' , 2),
    validation(validators.createPost),
    postService.createPost
)

router.patch('/:postId',
    authentication(),
    authorization(endpoint.createPost),
    uploadCloudFile(fileValidations.image).array('attachment' , 2),
    validation(validators.updatePost),
    postService.updatePost
)


router.delete('/:postId',
    authentication(),
    authorization(endpoint.freezePost),
    uploadCloudFile(fileValidations.image).array('attachment' , 2),
    validation(validators.freezePost),
    postService.freezePost
)

router.patch('/:postId/restore',
    authentication(),
    authorization(endpoint.freezePost),
    uploadCloudFile(fileValidations.image).array('attachment' , 2),
    validation(validators.freezePost),
    postService.unfreezePost
)
router.patch('/:postId/like',
    authentication(),
    authorization(endpoint.likePost),
    uploadCloudFile(fileValidations.image).array('attachment' , 2),
    validation(validators.likePost),
    postService.likePost
)


export default router