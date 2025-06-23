import { NextRequest } from 'next/server'

const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { story } = await req.json()
        const res = await fetch('https://api.fanar.qa/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Fanar-Aura-TTS-1',
                input: story,
                voice: 'default',
                format: 'mp3'
            })
        })

        const audioBuffer = await res.arrayBuffer()
        return new Response(audioBuffer, {
            headers: { 'Content-Type': 'audio/mp3' }
        })

    }
    catch (err)
    {
        console.error(err)
        return new Response(JSON.stringify({ error: 'TTS generation failed' }), { status: 500 })
    }
}