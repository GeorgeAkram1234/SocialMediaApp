import mongoose, { model, Schema } from "mongoose";
import { Types } from "mongoose";
import { generateHash } from "../../utils/security/hash.js";

export const genderTypes = {
    male: 'male',
    female: 'female'
}

export const roleTypes = {
    User: "User",
    Admin: "Admin",
    superAdmin: "superAdmin",
}

export const providerTypes = {
    google: "google",
    system: "system"
}


const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'please enter your userName'],
        minlength: 2,
        maxlength: 50,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: (data) => {
            return data?.provider === providerTypes.google ? false : true
        }
    },
    gender: {
        type: String,
        enum: Object.values(genderTypes),
        default: genderTypes.male
    },
    role: {
        type: String,
        enum: Object.values(roleTypes),
        default: roleTypes.User
    },
    isDeleted: Date,
    phone: String,
    image: { secure_url: String, public_id: String },
    coverImages: [{ secure_url: String, public_id: String }],
    address: String,
    DOB: Date,
    changeCredentialTime: Date,
    confirmEmail: {
        type: Boolean,
        default: false
    },
    confirmEmailOTP: String,
    resetPasswordOTP: String,
    provider: {
        type: String,
        enum: Object.values(providerTypes),
        default: providerTypes.system
    },
    viewers: [{
        userId: { type: Types.ObjectId, ref: 'User' },
        time: Date
    }],
    friends: [{ type: Types.ObjectId, ref: 'User' }],
    tempEmail: String,
    tempEmailOTP: String,
    updatedBy: { type: Types.ObjectId, ref: 'User' },

}, { timestamps: true })


// userSchema.index({} , {expireAfterSeconds : 120})
// userSchema.pre('save', function (next, doc) {
//     console.log({ this: this });
//     console.log(doc);

//     this.password = generateHash({ plainText: this.password })
//     next()

// })
// userSchema.post('save', function (doc, next) {


// })

const userModel = mongoose.models.User || model("User", userSchema)

export default userModel

export const socketConnections = new Map()
