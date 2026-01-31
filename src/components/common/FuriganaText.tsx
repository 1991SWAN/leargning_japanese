'use client';

import React from 'react';

interface FuriganaTextProps {
  text: string;
  className?: string;
}

/**
 * 1. 漢字[かんじ] 형태의 텍스트
 * 2. <ruby> 텍스트
 * 두 형태를 모두 처리하여 렌더링하는 컴포넌트
 */
export default function FuriganaText({ text, className = '' }: FuriganaTextProps) {
  if (!text) return null;

  // 1. HTML Ruby Fallback (Legacy Support)
  // DB에 남아있을 수 있는 HTML 태그를 우선 처리
  if (text.includes('<ruby>')) {
    const rubyParts = text.split(/(<ruby>.*?<\/ruby>)/g);
    return (
      <span className={`furigana-container ${className}`}>
        {rubyParts.map((part, index) => {
          if (part.startsWith('<ruby>')) {
            const kanji = part.replace(/<ruby>(.*?)<rt>.*?<\/rt>.*?<\/ruby>/, '$1').replace(/<rp>.*?<\/rp>/g, '');
            const reading = part.replace(/<ruby>.*?<rt>(.*?)<\/rt>.*?<\/ruby>/, '$1');
            return (
              <ruby key={index}>
                {kanji}
                <rt>{reading}</rt>
              </ruby>
            );
          }
          return <span key={index}>{part}</span>;
        })}
        {styleTag}
      </span>
    );
  }

  // 2. Bracket Notation Parser (Main Logic)
  // Kanji[Furigana] or 漢字[かんじ] pattern
  // Improved Regex: Handles optional space between text and bracket
  const parts = text.split(/([^\s\[]+?)\s*\[([^\]]+)\]/g);

  // If split doesn't find matches correctly for mapping, we might need a different approach.
  // The split method with capturing groups returns: [pre-match, capture1, capture2, post-match...]
  // But strictly splitting by 'text[reading]' structure is safer.

  // Let's use a robust tokenization approach.
  const tokens = [];
  let lastIndex = 0;
  const regex = /([\u4e00-\u9faf\u3005\u4e00-\u9fff\u3400-\u4dbf]+|[a-zA-Z0-9]+|[^\s\[\u3000])\s*\[([^\]]+)\]/g; // Try to match Kanji group first, then alphanumeric, then single char
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    // Add the ruby group
    tokens.push({ type: 'ruby', kanji: match[1], reading: match[2] });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return (
    <span className={`furigana-container ${className}`}>
      {tokens.map((token, index) => {
        if (token.type === 'ruby') {
          return (
            <ruby key={index}>
              {token.kanji}
              <rt>{token.reading}</rt>
            </ruby>
          );
        }
        return <span key={index}>{token.content}</span>;
      })}
      {styleTag}
    </span>
  );
}

const styleTag = (
  <style jsx>{`
    ruby {
      ruby-align: center;
      ruby-position: over;
    }
    rt {
      font-size: 0.55em;
      color: var(--primary);
      letter-spacing: 0.05em;
      user-select: none;
      font-weight: 500;
      line-height: 1;
    }
    .furigana-container {
      line-height: 1.8;
      display: inline-block;
    }
  `}</style>
);
