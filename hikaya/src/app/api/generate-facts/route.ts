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
أنت خبير في التراث الإسلامي والعربي. مهمتك إنشاء حقيقة واحدة دقيقة ومهمة ثقافياً.

${topicLine}

**القواعد الصارمة:**
- الحقيقة يجب أن تكون قصيرة (سطر واحد أو سطرين فقط) ومكتوبة باللغة العربية
- لا تكتب أي شرح أو عنوان أو مقدمة مثل "بالتأكيد" أو "إليك الحقيقة"
- لا تكتب أي رموز تنسيق مثل ", ', \, إلخ
- لا تكرر حقائق شائعة مثل "القرآن هو الكتاب المقدس" أو "العربية هي لغة القرآن"
- لا تكتب أكثر من حقيقة واحدة
- لا تكتب أي شيء باللغة الإنجليزية
- المخرجات يجب أن تحتوي فقط على الحقيقة العربية في سطر واحد. لا شيء آخر.

**مثال على التنسيق المطلوب:**
الحقيقة: [الحقيقة العربية هنا]

**مهم جداً:** اكتب فقط الحقيقة باللغة العربية. لا شيء آخر.
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