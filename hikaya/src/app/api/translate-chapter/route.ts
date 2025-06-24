import { NextRequest, NextResponse } from 'next/server'

const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { chapter } = await req.json()

        const prompt = `
Translate the following Arabic story excerpt into English (preserve the tone and style for children):

${chapter.trim()}
        `.trim()

        const res = await fetch('https://api.fanar.qa/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Fanar-S-1-7B',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5
            })
        })
        
        const json = await res.json()
        console.log('Fanar response:', JSON.stringify(json, null, 2))
        const translation = json.choices?.[0]?.message?.content?.trim() ?? ''
        return NextResponse.json({ translation })

    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
    }
}