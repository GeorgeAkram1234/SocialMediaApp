import mongoose, { model, Schema, Types } from "mongoose"


const chatSchema = new Schema({
    mainUser: { type: Types.ObjectId, ref: 'User', required: true },
    subParticipant: { type: Types.ObjectId, ref: 'User', required: true },
    messages: [
        {
            message: { type: String, required: true },
            senderId: { type: Types.ObjectId, ref: 'User', required: true },
        }
    ]
})

const chatModel = mongoose.models.Chat || model('Chat' , chatSchema)

export default chatModel