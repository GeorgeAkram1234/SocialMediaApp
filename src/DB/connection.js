import mongoose from "mongoose";
const connectDB = async () => {

    return await mongoose.connect(process.env.DB_URI).then(res => {
        console.log(`Db connected`);
    }).catch(err => {
        console.error('Fail to connect on DB', err);
    })
}

export default connectDB