import { NextRequest, NextResponse } from 'next/server'

const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { keywords, level, attempt = 1 } = await req.json()

        const themes = Array.isArray(keywords) ? keywords.join(', ') : keywords
        
        // Use different prompts based on attempt number
        let prompt: string
        
        if (attempt === 1) {
            // First attempt: comprehensive prompt
            prompt = `
أنشئ قصة أطفال عربية جميلة ومتماسكة. اتبع هذه التعليمات بدقة:

**المتطلبات الأساسية:**
- القصة يجب أن تكون منطقية ومتماسكة من البداية للنهاية
- يجب أن يكون لها حبكة واضحة: بداية، مشكلة، حل، نهاية سعيدة
- الشخصيات يجب أن تكون واضحة ومتطورة
- الأحداث يجب أن تتبع منطقاً واضحاً
- اللغة مناسبة لمستوى [${level}]

**الموضوع والثقافة:**
- ركز على [${themes}] كموضوع رئيسي
- ادمج قيم إسلامية وعربية أصيلة
- علم الأطفال دروساً مفيدة عن الخير، الصداقة، العائلة، أو المساعدة
- اجعل القصة ممتعة ومشوقة للأطفال

**هيكل القصة (4 فصول):**
- **الفصل الأول**: مقدمة الشخصيات والمكان، بداية القصة
- **الفصل الثاني**: ظهور المشكلة أو التحدي
- **الفصل الثالث**: محاولة حل المشكلة، تطوير الأحداث
- **الفصل الرابع**: حل المشكلة، النهاية السعيدة، الدرس المستفاد

**قواعد مهمة:**
- اجعل كل فصل يتبع منطقياً من الفصل السابق
- تأكد من أن الشخصيات تتصرف بطريقة منطقية
- اربط الأحداث ببعضها البعض
- لا تترك أحداثاً معلقة أو غير مكتملة
- اجعل النهاية مرضية ومفيدة

**مثال على قصة متماسكة:**
إذا كان الموضوع "الطبخ":
- الفصل 1: الطفل يريد مساعدة أمه في الطبخ
- الفصل 2: يواجه صعوبة في فهم الوصفة
- الفصل 3: يحاول ويخطئ ثم يتعلم
- الفصل 4: ينجح في طبخ شيء بسيط ويفرح

**التنسيق المطلوب:**
[العنوان]: عنوان القصة

[الفصل الأول]: محتوى الفصل الأول

[الفصل الثاني]: محتوى الفصل الثاني

[الفصل الثالث]: محتوى الفصل الثالث

[الفصل الرابع]: محتوى الفصل الرابع

**مهم جداً:** اكتب القصة باللغة العربية فقط، بدون أي تعليقات إضافية أو ملاحظات أو شرح للهيكل. لا تكتب "الأول: مقدمة" أو أي شيء مشابه في محتوى القصة - فقط اكتب القصة نفسها.
            `.trim()
        } else {
            // Retry attempts: simpler, more direct prompt
            prompt = `
أنشئ قصة أطفال بسيطة ومتماسكة عن [${themes}].

**المتطلبات:**
- قصة منطقية مع بداية ووسط ونهاية
- شخصية رئيسية واضحة
- مشكلة بسيطة وحل
- نهاية سعيدة
- لغة مناسبة لمستوى [${level}]

**التنسيق:**
[العنوان]: عنوان القصة

[الفصل الأول]: محتوى الفصل الأول

[الفصل الثاني]: محتوى الفصل الثاني

[الفصل الثالث]: محتوى الفصل الثالث

[الفصل الرابع]: محتوى الفصل الرابع

**مهم:** اكتب باللغة العربية فقط. لا تكتب أي شرح أو تعليمات في محتوى القصة - فقط اكتب القصة نفسها.
            `.trim()
        }

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
                temperature: attempt === 1 ? 0.7 : 0.4, // Lower temperature for retries
                max_tokens: 1200 // Increased tokens for better stories
            })
        })

        const json = await res.json()
        const content = json.choices?.[0]?.message?.content?.trim() ?? ''
        console.log(`Generated story (attempt ${attempt}):`, content.substring(0, 100) + '...')
        return NextResponse.json({ story: content })

    }
    catch (err)
    {
        console.error(err)
        return NextResponse.json({ error: 'Story generation failed' }, { status: 500 })
    }
}