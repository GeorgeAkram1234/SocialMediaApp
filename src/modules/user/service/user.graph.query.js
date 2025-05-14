import { authentication } from "../../../middleware/graph/auth.middleware.js"


export const getProfile = async (parent, args) => {

    const { authorization } = args
    const user = await authentication({ authorization })
    return {message : "done" , statusCode : 200 , data : user} 
}