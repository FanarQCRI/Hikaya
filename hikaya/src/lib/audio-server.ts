import ffmpegPath from 'ffmpeg-static'
import ffprobePath from 'ffprobe-static'
import ffmpeg from 'fluent-ffmpeg'

export function getAudioDurationFromBuffer(buffer: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
        const tmp = require('tmp')
        const tmpFile = tmp.fileSync({ postfix: '.mp3' })
        const fs = require('fs')
        fs.writeFileSync(tmpFile.name, buffer)

        ffmpeg.setFfprobePath(ffprobePath.path!)
        ffmpeg(tmpFile.name).ffprobe((err: any, data: any) => {
            if (err) return reject(err)
            resolve(data.format.duration)
        })
    })
} 