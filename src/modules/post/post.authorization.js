import { roleTypes } from "../../DB/model/User.model.js";

export const endpoint = {
    createPost : [roleTypes.User],
    freezePost : [roleTypes.User , roleTypes.Admin],
    likePost : [roleTypes.User , roleTypes.Admin],
}