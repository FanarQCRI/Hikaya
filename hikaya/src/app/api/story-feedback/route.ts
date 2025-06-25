import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import ffprobePath from 'ffprobe-static'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { randomUUID } from 'crypto'

export const config = {
    api: {
        bodyParser: false,
    },
}

const FANAR_KEY = process.env.FANAR_API_KEY!

function getAudioDurationFromBuffer(buffer: Buffer): Promise<number>
{
    return new Promise((resolve, reject) => {
        const tmpPath = path.join(os.tmpdir(), `${randomUUID()}.mp3`)
        fs.writeFileSync(tmpPath, buffer)

        ffmpeg.setFfprobePath(ffprobePath.path!)
        ffmpeg(tmpPath).ffprobe((err: any, data: any) => {
            fs.unlinkSync(tmpPath)
            if (err) return reject(err)
            resolve(data.format.duration)
        })
    })
}

export async function POST(req: NextRequest)
{
    try {
        const formData = await req.formData()
        const file = formData.get('audio') as File
        const story = formData.get('story') as string

        if (!file || !story)
        { return NextResponse.json({ error: 'Missing audio or story' }, { status: 400 }) }

        const buffer = Buffer.from(await file.arrayBuffer())

        // Detect audio duration
        let durationInSeconds = 0
        try { durationInSeconds = await getAudioDurationFromBuffer(buffer) }
        catch (err) { console.warn('Duration detection failed, defaulting to short STT model') }

        const transcriptionModel =
        durationInSeconds > 30 ? 'Fanar-Aura-STT-LF-1' : 'Fanar-Aura-STT-1'

        // Step 1: Transcribe audio
        const transcriptionForm = new FormData()
        transcriptionForm.append('model', transcriptionModel)
        transcriptionForm.append('language', 'ar')
        transcriptionForm.append('file', new Blob([buffer]), file.name || 'audio.mp3')

        const transcriptionRes = await fetch('https://api.fanar.qa/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${FANAR_KEY}`
            },
            body: transcriptionForm
        })

        const transcriptionJson = await transcriptionRes.json()
        const transcript = transcriptionJson.text ?? ''

        // Step 2: Generate feedback using story + transcript
        const prompt = `
هذه هي القصة التي قرأها الطفل:

${story}

وهذه هي إجابة الطفل على القصة بصوته:

${transcript}

قم بتقديم تعليق إيجابي قصير يناسب الأطفال، لتشجيعه على مشاركته وفهمه. إذا كان ما قاله صحيحًا أو مرتبطًا بالقصة، امدحه بلطف. إذا لم يكن مرتبطًا، أشكره وشجعه على المحاولة.

لا حاجة لتصحيح لغوي. فقط تعليق قصير من 2-3 أسطر باللغة العربية.
        `.trim()

        const chatRes = await fetch('https://api.fanar.qa/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Fanar-S-1-7B',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5
            })
        })

        const chatJson = await chatRes.json()
        const feedbackText = chatJson.choices?.[0]?.message?.content?.trim() ?? ''

        // Step 3: Convert feedback to audio
        const ttsRes = await fetch('https://api.fanar.qa/v1/audio/speech', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Fanar-Aura-TTS-1',
                input: feedbackText,
                voice: 'default',
                format: 'mp3'
            })
        })

        const audioBuffer = await ttsRes.arrayBuffer()
        const audioBase64 = Buffer.from(audioBuffer).toString('base64')

        return NextResponse.json({
            transcript,
            feedbackText,
            feedbackAudio: `data:audio/mp3;base64,${audioBase64}`
        })
    }
    catch (err)
    {
        console.error('[STORY FEEDBACK ERROR]', err)
        return NextResponse.json({ error: 'Feedback pipeline failed' }, { status: 500 })
    }
}