import * as postQueryService from './service/post.query.service.js'
import * as postMutationService from './service/post.mutation.service.js'
import * as postTypes from './types/post.types.js'
import { GraphQLEnumType, GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'

export const query = {

    postList: {
        type: postTypes.postListResponse,
        resolve: postQueryService.postList
    }
}

export const mutation = {


    likePost: {
        type: postTypes.likePostResponse,
        args: {
            postId : {type : new GraphQLNonNull(GraphQLID)},
            authorization : {type : new GraphQLNonNull(GraphQLString)},
            action : {type : new GraphQLNonNull(new GraphQLEnumType({
                name : 'action',
                values : {
                    like : {type : GraphQLString},
                    unLike : {type : GraphQLString}
                }
            }))}
        },
        resolve: postMutationService.likePost
    }
}