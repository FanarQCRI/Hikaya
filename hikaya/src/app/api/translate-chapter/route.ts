import { NextRequest, NextResponse } from 'next/server'
import { cleanChapterText } from '@/lib/utils'

const FANAR_KEY = process.env.FANAR_API_KEY!

// Utility function to clean Arabic chapter text
function cleanArabicText(text: string): string
{
    return text
        // Remove bracketed tags like [العنوان], [الفصل الأول]
        .replace(/\[[^\]]*\]/g, '')
        // Remove lines starting with section markers like "الفصل", "العنوان", "Chapter", etc.
        .replace(/^(الفصل|العنوان|chapter|title|section).*$/gim, '')
        // Remove separators like "---" or "———"
        .replace(/^[-–—\s]*$/gm, '')
        // Remove all English-only words
        .replace(/\b[a-zA-Z]+\b/g, '')
        // Remove remaining colons that follow empty tags or sections
        .replace(/^\s*:\s*/gm, '')
        // Collapse multiple blank lines into a single line
        .replace(/\n{2,}/g, '\n')
        // Remove leading/trailing whitespace and newlines
        .trim()
}

export async function POST(req: NextRequest)
{
    try
    {
        const { chapter } = await req.json()

        const cleanedText = cleanChapterText(chapter)

        const res = await fetch('https://api.fanar.qa/v1/translations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Fanar-Shaheen-MT-1',
                langpair: 'ar-en',
                text: cleanedText,
                options: {
                    preserve_formatting: true,
                    preserve_numbers: true,
                    preserve_names: true
                }
            })
        })

        const json = await res.json()
        const raw = json.text ?? ''
        const translation = raw.replace(/\s*\n\s*/g, ' ').trim()
        return NextResponse.json({ translation })

    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
    }
}