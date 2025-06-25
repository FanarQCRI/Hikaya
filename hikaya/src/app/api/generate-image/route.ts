import { NextRequest, NextResponse } from 'next/server'
import { cleanChapterText } from '@/lib/utils'

const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { chapter } = await req.json()
        const cleanedChapter = cleanChapterText(chapter)
        // console.log("Hit with chapter: ", cleanedChapter)
        const prompt = `
Read the following Arabic story chapter written for children:
"${cleanedChapter}"

Generate one colorful, storybook-style cartoony-not realistic illustration that visually represents the main scene and mood of this chapter. Must be Cartoonish and not realistic.
        `.trim()

        const res = await fetch('https://api.fanar.qa/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'Fanar-ImageGen-1',
                prompt,
                n: 1,
                size: '1024x1024',
                response_format: 'b64_json',
            }),
        })

        const json = await res.json()
        const base64 = json.data?.[0]?.b64_json

        if (!base64)
        {
            console.log('Fanar image error:', JSON.stringify(json))
            return NextResponse.json({ error: 'Image missing' }, { status: 500 })
        }

        // Return full image data URL
        return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` })
    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
    }
}