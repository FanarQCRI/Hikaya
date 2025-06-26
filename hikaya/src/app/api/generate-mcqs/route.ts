import { NextRequest, NextResponse } from 'next/server'
const FANAR_KEY = process.env.FANAR_API_KEY!

export async function POST(req: NextRequest)
{
    try
    {
        const { story, attempt = 1 } = await req.json()

        let prompt: string

        if (attempt === 1) {
            prompt = `
You are a skilled Arabic educator. You will be given a children's story in Arabic.
Your task is to generate exactly 5 multiple-choice questions (MCQs) based ONLY on information stated explicitly in the story.

Here is the story:

${story}

✳️ Strict rules:
- Create exactly 5 questions. No more, no less.
- All questions must ask about facts explicitly stated in the story text (not inferred or general knowledge).
- Each question must relate to a detail directly mentioned in the story: names, places, events, actions, outcomes.
- The correct answer must appear word-for-word in the story.
- Incorrect answers must be related but wrong, and either appear in the story or be reasonable distractors.
- Do not invent facts.
- Do not repeat generic or vague placeholders like "[Question about event]".
- Questions must be meaningful, well-formed, and match the child's comprehension level.

📝 Required question types (one of each):
1. A question about a character’s name
2. A question about a place mentioned in the story
3. A question about a specific event
4. A question about an action performed by someone
5. A question about the result or ending of the story

✳️ Output Format (in Arabic only):
1. [Arabic question clearly about the story]
أ. [option]
ب. [option]
ج. [option]
د. [option]
الإجابة الصحيحة: [أ أو ب أو ج أو د]

2. [next question]...

⚠️ DO NOT include instructions, explanations, or examples.
⚠️ ONLY output the Arabic questions in the format above.
            `.trim()
        } else {
            prompt = `
You will be given an Arabic story. Create exactly 5 multiple choice questions (MCQs) based strictly on the story.

Here is the story:

${story}

✅ Requirements:
- Exactly 5 MCQs.
- The correct answer must be stated word-for-word in the story.
- The question must relate to something specific: a name, place, event, action, or outcome.
- All answers (correct and incorrect) must be logical and Arabic only.
- Do not include generic placeholders or summaries.

📝 Format:
1. [Arabic question]
أ. [option]
ب. [option]
ج. [option]
د. [option]
الإجابة الصحيحة: [أ أو ب أو ج أو د]

⚠️ Your response must be in Arabic only. Do not include commentary or notes.
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
                messages: [{ role: 'user', content: prompt }],
                temperature: attempt === 1 ? 0.3 : 0.1,
                max_tokens: 1500
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