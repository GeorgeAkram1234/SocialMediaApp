import { Router } from "express";
import * as commentServices from './service/comment.service.js'
import { authentication, authorization } from "../../middleware/auth.middleware.js";
import { endpoint } from "./comment.authorization.js";
import { fileValidations, uploadCloudFile } from "../../utils/multer/cloud.multer.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './comment.validation.js'
const router = Router({ mergeParams: true, strict: true, caseSensitive: true })

router.post('/:commentId?',
    authentication(),
    authorization(endpoint.create),
    uploadCloudFile(fileValidations.image).array('attachment', 2),
    validation(validators.createComment),
    commentServices.createComment)

router.patch('/:commentId',
    authentication(),
    authorization(endpoint.update),
    uploadCloudFile(fileValidations.image).array('attachment', 2),
    validation(validators.updateComment),
    commentServices.updateComment)


router.delete('/:commentId/freeze',
    authentication(),
    authorization(endpoint.freeze),
    validation(validators.freezeComment),
    commentServices.freezeComment)


router.patch('/:commentId/un-freeze',
    authentication(),
    authorization(endpoint.freeze),
    validation(validators.freezeComment),
    commentServices.unfreezeComment)


export default router