import { NextRequest, NextResponse } from 'next/server'
const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try 
    {
        const { keywords } = await req.json()

        const keywordString = Array.isArray(keywords) && keywords.length
        ? `الموضوع هو: ${keywords.join(', ')}. `
        : ''

        const prompt = `
${keywordString}قدّم فقط حقيقتين دقيقتين ومؤكدتين تتعلقان بالثقافة أو التراث أو القيم الإسلامية والعربية.

- يجب أن تكون المعلومات واقعية ويمكن التحقق منها.
- لا تتخيل أو تنشئ أشياء وهمية.
- لا تستخدم عبارات عامة مثل "الإسلام دين جميل".
- استخدم تنسيق التعداد فقط (١، ٢).

اكتب بالعربية فقط. لا تكتب أي شرح إضافي.

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
                max_tokens: 400
            })
        })

        const json = await res.json()
        const facts = json.choices?.[0]?.message?.content?.trim() ?? ''
        return NextResponse.json({ facts })

    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'Facts generation failed' }, { status: 500 })
    }
}