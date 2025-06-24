import { NextRequest, NextResponse } from 'next/server'
const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { story } = await req.json()

        const prompt = `
اقرأ القصة العربية التالية بعناية، ثم قم بإعداد ٥ أسئلة اختيار من متعدد باللغة العربية. يجب أن تكون كل الأسئلة مبنية بشكل مباشر على أحداث القصة ومعلوماتها فقط.

كل سؤال يجب أن يحتوي على:
- نص السؤال
- أربع خيارات
- تحديد الخيار الصحيح

استخدم هذا التنسيق فقط:

1. السؤال
أ. ...
ب. ...
ج. ...
د. ...
الإجابة الصحيحة: (اكتب الخيار الصحيح هنا - أ، ب، ج، أو د)

[ابدأ القصة هنا]

${story}
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
                temperature: 0.7,
                max_tokens: 1200
            })
        })

        const json = await res.json()
        const content = json.choices?.[0]?.message?.content?.trim() ?? ''
        return NextResponse.json({ questions: content })

    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'MCQ generation failed' }, { status: 500 })
    }
}