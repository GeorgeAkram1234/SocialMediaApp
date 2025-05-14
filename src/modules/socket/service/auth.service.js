import { socketConnections } from "../../../DB/model/User.model.js";
import { authentication } from "../../../middleware/socket/auth.middleware.js";

export const registerSocket = async (socket) => {
    const { data, valid } = await authentication({ socket })
    console.log({ data, valid });
    if (!valid) {
        return socket.emit("socket_Error", data)
    }
    socketConnections.set(data.user._id.toString(), socket.id)
    console.log(socketConnections);
    return 'Done'
}


export const logoutSocketId = async (socket) => {
    socket.on('disconnect', async () => {
        const { data, valid } = await authentication({ socket })
        console.log({ data, valid });
        if (!valid) {
            return socket.emit("socket_Error", data)
        }
        socketConnections.delete(data.user._id.toString(), socket.id)
        console.log(socketConnections);
        return 'Done'
    })
}