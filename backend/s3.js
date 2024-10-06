import aws from 'aws-sdk'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { promisify } from "util"

const randomBytes = promisify(crypto.randomBytes)
dotenv.config();

const region = "ap-southeast-2"
const bucketName = "image-inference-direct-upload"

// TODO: Only configured to use for local development
const accessKeyID = process.env.ACCESSKEYID
const secretAccessKey = process.env.SECRETACCESSKEY

// const s3 = new aws.S3({
//     region,
//     accessKeyId: accessKeyID,
//     secretAccessKey,
//     signatureVersion: 'v4'
// })

const s3 = new aws.S3({
    region,
    credentials: {
        accessKeyId: process.env.ACCESSKEYID,
        secretAccessKey: process.env.SECRETACCESSKEY
    },
    signatureVersion: 'v4'
});

export async function generateUploadURL() {
    const rawBytes = await randomBytes(16)
    const imageName = rawBytes.toString('hex')

    const parmas = ({
        Bucket: bucketName,
        Key: imageName,
        Expires: 60
    })

    const uploadURL = await s3.getSignedUrlPromise('putObject', parmas)
    return uploadURL
}