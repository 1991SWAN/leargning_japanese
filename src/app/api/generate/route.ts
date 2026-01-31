import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { type, prompt, level, count, exclude, history, context } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const excludeRule = exclude && exclude.length > 0
            ? `\nCRITICAL: DO NOT generate any of these items as they already exist: [${exclude.join(", ")}]. Provide different items.`
            : "";

        const furiganaRule = "\nIMPORTANT: For Japanese text with Kanji, always use the format '漢字[かんじ]' (Kanji[Reading]) to provide Furigana. Apply this to all Japanese fields including example sentences.";

        let systemPrompt = "";
        if (type === "vocab_batch") {
            systemPrompt = `You are a Japanese language expert. 
      Generate ${count || 5} Japanese vocabulary items for JLPT level N${level || 5}.${excludeRule}${furiganaRule}
      Respond ONLY with a JSON array of objects, each having:
      "word" (Kanji[Reading] format if has Kanji), "reading" (Hiragana only), "meaning" (Korean), "level" (integer).
      Example: [{"word": "先生[せんせい]", "reading": "せんせい", "meaning": "선생님", "level": 5}]`;
        } else if (type === "vocab_context") {
            systemPrompt = `You are a Japanese language expert. 
      Generate ${count || 5} Japanese vocabulary items related to the theme: "${prompt}".${excludeRule}${furiganaRule}
      Respond ONLY with a JSON array of objects, each having:
      "word" (Kanji[Reading] format if has Kanji), "reading" (Hiragana only), "meaning" (Korean), "level" (integer 1-5).
      Example: [{"word": "空港[くうこう]", "reading": "くうこう", "meaning": "공항", "level": 5}]`;
        } else if (type === "grammar_batch") {
            systemPrompt = `You are a Japanese language expert. 
      Generate a Japanese grammar point for JLPT N${level || 5}.${excludeRule}${furiganaRule}
      Respond ONLY with a JSON object having:
      "title" (The grammar point),
      "level" (integer),
      "explanation" (Detailed explanation in Korean),
      "example_sentences" (Array of 3 objects, each with "jp" (Kanji[Reading] format for all Kanji), "reading" (Hiragana only), "ko" (Korean)).
      Example: {"title": "~てください", "level": 5, "explanation": "부탁이나 명령을 나타내는 표현...", "example_sentences": [{"jp": "座[すわ]ってください", "reading": "すわってください", "ko": "앉아 주세요"}]}`;
        } else if (type === "conversation") {
            const contextItems = context && context.length > 0
                ? `\nCURRENT LEARNING CONTEXT: The user is currently studying these items: [${context.map((c: any) => c.kanji || c.pattern).join(", ")}]. Try to use or mention some of these items naturally in the conversation.`
                : "";

            const historyStr = history && history.length > 0
                ? history.map((m: any) => `${m.role === 'user' ? 'User' : 'Tutor'}: ${m.content}`).join('\n')
                : "No previous messages.";

            systemPrompt = `You are an encouraging Japanese tutor for beginners (JLPT N5 level).
      Your goal is to practice conversational Japanese with the user.${contextItems}
      
      GUIDELINES:
      1. Always respond in Japanese first, then provide a Korean translation in parentheses.
      2. If the user makes a mistake (grammar, word choice), gently correct them.
      3. Use simple N5 level grammar and vocabulary.
      4. If you use Kanji, always use the format '漢字[かんじ]' (Kanji[Reading]).
      5. Keep the conversation engaging and always ask a follow-up question.
      
      CONVERSATION HISTORY:
      ${historyStr}
      
      User's latest message: ${prompt}
      
      Respond ONLY with a JSON object having:
      "text" (Your response content including Korean translation).
      Example: {"text": "こんにちは！お元気[げんき]ですか？ (안녕하세요! 잘 지내시나요?)"}`;
        }

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();

        // JSON 추출 (Markdown 코드 블록 제거)
        text = text.replace(/```json|```/gi, "").trim();

        const data = JSON.parse(text);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
