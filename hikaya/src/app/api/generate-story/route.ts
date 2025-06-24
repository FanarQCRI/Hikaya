import { NextRequest, NextResponse } from 'next/server'

const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { keywords, level } = await req.json()

        const themes = Array.isArray(keywords) ? keywords.join(', ') : keywords
        const prompt = `
Please generate a children's story in Modern Standard Arabic (MSA). Follow these exact instructions:

The story must be fun, engaging, and suitable for children.
The theme must center around [${themes}] and should help children learn about Islamic and Arabic heritage or culture.
The Arabic should be of [${level}] difficulty, understandable for school-aged children.
The story should be around 3 minutes long when read aloud.
It must be a proper fictional story, not a lecture or list of facts.
The story must be divided into 4 short chapters, each with its own chapter title (subheading).

Output format (follow exactly, and write in Arabic only):

Title: [Arabic Story Title]

[Chapter 1 Title]
[Chapter 1 Story Content]

[Chapter 2 Title]
[Chapter 2 Story Content]

[Chapter 3 Title]
[Chapter 3 Story Content]

[Chapter 4 Title]
[Chapter 4 Story Content]

DO NOT include any extra explanation, notes, or text — only the story in Arabic, exactly in the format
        `.trim()

        const res = await fetch('https://api.fanar.qa/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FANAR_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Fanar-S-1-7B',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        })

        const json = await res.json()
        //console.log('Fanar response:', JSON.stringify(json, null, 2))
        const content = json.choices?.[0]?.message?.content?.trim() ?? ''
        console.log(content)
        return NextResponse.json({ story: content })

    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'Story generation failed' }, { status: 500 })
    }
}