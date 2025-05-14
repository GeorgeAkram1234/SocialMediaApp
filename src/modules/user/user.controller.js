import { Router } from "express";
import { authentication, authorization } from "../../middleware/auth.middleware.js";
import * as userService from './service/user.service.js'
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
import { fileValidations, uploadFileDisk } from "../../utils/multer/local.multer.js";
import { uploadCloudFile } from "../../utils/multer/cloud.multer.js";
import { endpoint } from "./user.authorization.js";


const router = Router()



router.patch('/profile/friends/:friendId' , authentication() , userService.sendFriendRequest)
router.patch('/profile/friends/:friendRequestId/accept' , authentication() , userService.acceptFriendRequest)
router.get('/profile', authentication(), userService.profile)

router.get('/profile/dashboard', authentication(), authorization(endpoint.changeRoles), userService.dashboard)


router.patch('/:userId/profile/dashboard/role', authentication(), authorization(endpoint.changeRoles), userService.changeRoles)


router.get('/profile/:profileId', validation(validators.shareProfile), authentication(), userService.shareProfile)
router.patch('/profile/email', validation(validators.updateEmail), authentication(), userService.updateEmail)
router.patch('/profile/reset-email', validation(validators.resetEmail), authentication(), userService.resetEmail)
router.patch('/profile/password', validation(validators.updatePassword), authentication(), userService.updatePassword)
router.patch('/profile', validation(validators.updateProfile), authentication(), userService.updateProfile)


router.patch('/profile/image'
    , authentication(),
    uploadCloudFile(fileValidations.image).single('attachment'),
    validation(validators.profileImage),
    userService.updateProfileImage)


router.patch('/profile/cover'
    , authentication(),
    uploadCloudFile(fileValidations.image).array('attachment', 3),
    userService.updateProfileCoverImage)



// router.patch('/profile/identity'
//     , authentication(),
//     uploadFileDisk(['user/profile', ...fileValidations.document, ...fileValidations.image]).fields([
//         { name: 'image', maxCount: 3 },
//         { name: 'data', maxCount: 2 }
//     ]),
//     userService.updateProfileIdentity)


export default router