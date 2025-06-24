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
The story should be around 2 minutes long when read aloud.
It must be a proper fictional story, not a lecture or list of facts.
The story must be divided into 4 short chapters.

Output format (follow format strictly, and write in Arabic only - NO SPECIAL CHARACTERS EXCEPT FOR [TITLE], [CHAPTER 1], [CHAPTER 2], [CHAPTER 3], [CHAPTER 4] AND NO FONT STYLING):

[Title]: Story Title

[Chapter 1]: Chapter Content

[Chapter 2]: Chapter Content

[Chapter 3]: Chapter Content

[Chapter 4]: Chapter Content

DO NOT include any extra explanation, notes, or no extra text — only the story in Arabic, exactly in the format
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