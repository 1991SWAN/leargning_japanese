'use client';

import React from 'react';

interface FuriganaTextProps {
    text: string;
    className?: string;
}

/**
 * 漢字[かんじ] 형태의 텍스트를 파싱하여 <ruby> 태그로 렌더링하는 컴포넌트
 */
export default function FuriganaText({ text, className = '' }: FuriganaTextProps) {
    if (!text) return null;

    // 漢字[かんじ] 패턴을 찾는 정규표현식
    // [^\[]+ : '['가 아닌 문자들 (한자 또는 일반 텍스트)
    // \[([^\]]+)\] : '['와 ']' 사이의 문자들 (후리가나)
    const parts = text.split(/([^\s\[]+\[[^\]]+\])/g);

    return (
        <span className={`furigana-container ${className}`}>
            {parts.map((part, index) => {
                const match = part.match(/^([^\[]+)\[([^\]]+)\]$/);

                if (match) {
                    const [, kanji, reading] = match;
                    return (
                        <ruby key={index}>
                            {kanji}
                            <rt>{reading}</rt>
                        </ruby>
                    );
                }

                return <span key={index}>{part}</span>;
            })}

            <style jsx>{`
        ruby {
          ruby-align: center;
          ruby-position: over;
        }
        rt {
          font-size: 0.55em;
          color: var(--primary);
          letter-spacing: 0.05em;
          user-select: none; /* 드래그 시 후리가나는 제외되도록 설정 */
          font-weight: 500;
        }
        .furigana-container {
          line-height: 1.8; /* 후리가나 공간 확보를 위해 줄 간격 조정 */
        }
      `}</style>
        </span>
    );
}
