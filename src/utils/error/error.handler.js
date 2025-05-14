export const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(error => {
            return next(error, { cause: 500 })
        })
    }
}

export const globalErrorHandling = (error, req, res, next) => {
    if (process.env.MODE == "DEV") {
        return res.status(error.cause || 400).json({
            message: "Global error",
            error
            , msg: error.message
            , stack: error.stack
        })
    }
    return res.status(error.cause || 400).json({
        message: "Global error",
        msg: error.message
    })
}