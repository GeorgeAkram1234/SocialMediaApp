import { roleTypes } from "../../DB/model/User.model.js";


export const endpoint = {
    create: [roleTypes.User],
    update: [roleTypes.User],
    freeze :[roleTypes.User , roleTypes.Admin]
}