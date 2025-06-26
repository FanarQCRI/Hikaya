import { NextRequest, NextResponse } from 'next/server'
const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { keywords } = await req.json()

        const hasKeywords = Array.isArray(keywords) && keywords.length > 0
        const topicLine = hasKeywords
        ? `Here is the chosen topic (if any): ${keywords.join(', ')}.`
        : `Here is the chosen topic (if any):`

        const prompt = `
Please generate one accurate and culturally significant fact related to Islamic or Arabic heritage, tradition, history, values, or beliefs.

If one or more keywords are provided, the fact must also relate specifically to those topics.

Strict instructions:
- The fact must be short (1-2 lines only) and written in Arabic.
- Do NOT include any explanation, heading, introduction, or comment like “بالتأكيد” or “إليك الحقيقة”.
- Do NOT include any formatting characters such as ", ', \, etc..
- Do NOT repeat common facts like “The Qur'an is the holy book” or “Arabic is the language of the Qur'an”.
- Do NOT write more than one fact.
- Do NOT return anything in English.
- The output must only contain the Arabic fact on one line. Nothing else.

${topicLine}

Output only the fact, in Arabic. Nothing more.
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
                temperature: 0.6,
                max_tokens: 200
            })
        })

        const json = await res.json()
        const fact = json.choices?.[0]?.message?.content?.trim() ?? ''
        return NextResponse.json({ fact })

    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'Fact generation failed' }, { status: 500 })
    }
}