import multer from "multer";
import path from 'node:path';
import fs from 'node:fs'

export const fileValidations = {
    image: ['image/jpeg', 'image/png', 'image/gif'],
    document: ['application/pdf', 'application/docx']
}
export const uploadFileDisk = (customPath = 'general', fileValidation = []) => {

    const basePath = `uploads/${customPath}`
    const fullPath = path.resolve(`./src/${basePath}`)

    // console.log({ basePath, fullPath, checkPath: fs.existsSync(fullPath) });

    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
    }

    const storage = multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, fullPath)
        },
        filename: (req, file, callback) => {
            // console.log({ file });

            const finalFileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + file.originalname
            file.finalPath = basePath + `/` + finalFileName
            callback(null, finalFileName)
        }
    })

    function fileFilter(req, file, callback) {
        if (fileValidation.includes(file.mimetype)) {
            callback(null, true)
        } else {
            callback("in valid file format ", false)
        }
    }

    return multer({ dest: 'tempPath', fileFilter, storage })
}
