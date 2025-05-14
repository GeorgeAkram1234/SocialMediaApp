import mongoose, { model, Schema, Types } from "mongoose";


const postSchema = new Schema({
    content: {
        type: String,
        minlength: 2,
        maxlength: 50000,
        trim: true,
        required: function () {
            this.attachments?.length ? false : true
        }
    },
    attachments: [{ secure_url: String, public_id: String }],
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    // comments: [{ type: Types.ObjectId, ref: 'Comment' }],
    tags: [{ type: Types.ObjectId, ref: 'User' }],
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Types.ObjectId, ref: 'User' },
    deletedBy: { type: Types.ObjectId, ref: 'User' },
    isDeleted: Date
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})

postSchema.virtual('comments', {
    ref: "Comment",
    localField: '_id',
    foreignField: 'postId',
    justOne : true
})

const postModel = mongoose.models.Post || model('Post', postSchema)

export default postModel