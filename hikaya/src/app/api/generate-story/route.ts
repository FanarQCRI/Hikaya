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
            // First attempt: comprehensive prompt with clear formatting instructions
            prompt = `
أنت كاتب قصص أطفال محترف. مهمتك إنشاء قصة عربية جميلة ومتماسكة للأطفال.

**المتطلبات الأساسية:**
- قصة منطقية ومتماسكة من البداية للنهاية
- حبكة واضحة: بداية، مشكلة، حل، نهاية سعيدة
- شخصيات واضحة ومتطورة
- أحداث تتبع منطقاً واضحاً
- لغة مناسبة لمستوى [${level}]

**الموضوع والثقافة:**
- ركز على [${themes}] كموضوع رئيسي
- ادمج قيم إسلامية وعربية أصيلة
- علم الأطفال دروساً مفيدة عن الخير، الصداقة، العائلة، أو المساعدة
- اجعل القصة ممتعة ومشوقة للأطفال

**هيكل القصة:**
- **البداية**: مقدمة الشخصيات والمكان، بداية القصة
- **المشكلة**: ظهور التحدي أو المشكلة
- **التطوير**: محاولة حل المشكلة، تطوير الأحداث
- **الحل**: حل المشكلة، النهاية السعيدة، الدرس المستفاد

**التنسيق المطلوب - استخدم هذا التنسيق بالضبط:**

[العنوان]: عنوان القصة

[الفصل الأول]: محتوى الفصل الأول

[الفصل الثاني]: محتوى الفصل الثاني

[الفصل الثالث]: محتوى الفصل الثالث

[الفصل الرابع]: محتوى الفصل الرابع

**قواعد مهمة جداً:**
- اكتب القصة باللغة العربية فقط
- لا تكتب أي تعليقات أو ملاحظات أو شرح
- لا تكتب "الأول:" أو "الثاني:" أو أي أرقام ترتيبية في محتوى القصة
- لا تكتب "مقدمة:" أو "المشكلة:" أو أي عناوين فرعية
- اكتب فقط محتوى القصة نفسها
- تأكد من أن كل فصل يحتوي على نص كامل ومفيد
- اجعل النهاية مرضية ومفيدة
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

**التنسيق المطلوب:**

[العنوان]: عنوان القصة

[الفصل الأول]: محتوى الفصل الأول

[الفصل الثاني]: محتوى الفصل الثاني

[الفصل الثالث]: محتوى الفصل الثالث

[الفصل الرابع]: محتوى الفصل الرابع

**مهم:** اكتب باللغة العربية فقط. لا تكتب أي شرح أو تعليمات أو أرقام ترتيبية في محتوى القصة.
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
                temperature: attempt === 1 ? 0.6 : 0.3, // Lower temperature for retries
                max_tokens: 1500 // Increased tokens for better stories
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