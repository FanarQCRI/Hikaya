import { NextRequest } from 'next/server'

const FANAR_KEY = process.env.FANAR_API_KEY

export async function POST(req: NextRequest)
{
    try
    {
        const { story } = await req.json()
        
        if (!story || typeof story !== 'string') {
            return new Response(JSON.stringify({ error: 'Invalid story text provided' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        console.log('Generating TTS for text:', story.substring(0, 100) + '...')
        
        const res = await fetch('https://api.fanar.qa/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Fanar-Aura-TTS-1',
                input: story,
                voice: 'default', // Using 'default' voice as required by the API
                format: 'mp3'
            })
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error('Fanar TTS API error:', res.status, errorText)
            return new Response(JSON.stringify({ 
                error: 'TTS generation failed', 
                details: `API returned ${res.status}: ${errorText}` 
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const audioBuffer = await res.arrayBuffer()
        console.log('TTS generated successfully, audio size:', audioBuffer.byteLength, 'bytes')
        
        return new Response(audioBuffer, {
            headers: { 'Content-Type': 'audio/mp3' }
        })

    }
    catch (err)
    {
        console.error('TTS generation error:', err)
        return new Response(JSON.stringify({ 
            error: 'TTS generation failed', 
            details: err instanceof Error ? err.message : 'Unknown error'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}