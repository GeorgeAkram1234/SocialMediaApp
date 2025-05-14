import * as dbService from "../../../DB/db.service.js";
import postModel from "../../../DB/model/Post.model.js";
import { authentication } from "../../../middleware/graph/auth.middleware.js";
import { validation } from "../../../middleware/graph/validation.middleware.js";
import { likePostValidateGraph } from "../post.validation.js";


export const likePost = async (parent, args) => {
    const { postId, action, authorization } = args
    await validation(likePostValidateGraph , args)
    const user = await authentication({ authorization })

    const data = action === 'unLike' ?
        { $pull: { likes: user._id } } :
        { $addToSet: { likes: user._id } }

    const post = await dbService.findOneAndUpdate({
        model: postModel,
        filter: {
            _id: postId
        },
        data
    })

    return { message: "done", statusCode: 200, data: post }
}