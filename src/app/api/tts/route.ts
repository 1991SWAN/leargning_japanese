import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";

const execAsync = promisify(exec);

// 인메모리 캐시 (서버 프로세스 유지 동안 유효)
const ttsCache = new Map<string, Buffer>();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");

    if (!text) {
        return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 1. 캐시 확인
    if (ttsCache.has(text)) {
        const cachedBuffer = ttsCache.get(text)!;
        return new Response(new Uint8Array(cachedBuffer), {
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": cachedBuffer.length.toString(),
                "X-Cache": "HIT",
            },
        });
    }

    // 임시 파일 경로 생성
    const tempFile = path.join(os.tmpdir(), `tts_${Date.now()}.wav`);

    try {
        // macOS 'say' 명령어를 사용하여 고품질 음성(Kyoko) 생성
        // 샘플 레이트를 22050Hz로 낮추어 생성 속도 및 전송 효율 최적화
        await execAsync(`say -v Kyoko "${text.replace(/"/g, '\\"')}" -o "${tempFile}" --data-format=LEI16@22050`);

        if (!fs.existsSync(tempFile)) {
            throw new Error("Failed to generate audio file");
        }

        const audioBuffer = fs.readFileSync(tempFile);

        // 2. 캐시에 저장 (메모리 관리 차원에서 너무 긴 텍스트는 제외할 수도 있으나 현재는 모두 저장)
        if (text.length < 100) {
            ttsCache.set(text, audioBuffer);
        }

        // 사용 후 임시 파일 삭제
        fs.unlink(tempFile, (err) => {
            if (err) console.error("Temp file deletion error:", err);
        });

        return new Response(new Uint8Array(audioBuffer), {
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": audioBuffer.length.toString(),
                "X-Cache": "MISS",
            },
        });
    } catch (error: any) {
        console.error("TTS Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
