import mongoose, { Types, Schema, model } from "mongoose";


const friendRequestSchema = new Schema({
    friendId: { type: Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    status: { type: Boolean, default: false },

}, { timestamps: true })

const friendRequestModel = mongoose.models.FriendRequest || model('FriendRequest' , friendRequestSchema)


export default friendRequestModel