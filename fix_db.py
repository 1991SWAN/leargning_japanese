import json

# Vocabulary fix
vocab_query = "UPDATE vocabulary SET reading = 'がくせい' WHERE word = '学生';"

# Grammar fixes
grammar_data = [
    {
        "title": "~は ~입니다",
        "new_title": "~は ~です",
        "examples": [
            {"jp": "私は学生です。", "ko": "나는 학생입니다.", "reading": "わたしはがく세입니다."}, # wait
            {"jp": "これは本입니다.", "ko": "이것은 책입니다.", "reading": "이는 ほんです。"}  # wait
        ]
    }
]

# Let's just hardcode the clean strings directly in the SQL generator or script.
# Lesson 1
ex1_jp = "私は学生です。"
ex1_ko = "나는 학생입니다."
ex1_rd = "わたしはがくせいです。"
ex2_jp = "これは本입니다." # Korean word for 'is'
ex2_jp = "これは本です。"
ex2_ko = "이것은 책입니다."
ex2_rd = "이는 책입니다." # No!
ex2_rd = "これはほんです。"

les1_examples = [
    {"jp": ex1_jp, "ko": ex1_ko, "reading": ex1_rd},
    {"jp": ex2_jp, "ko": ex2_ko, "reading": ex2_rd}
]

# Lesson 2
ex3_jp = "私の先生입니다." # Korean word for 'is'
ex3_jp = "私の先生です。" 
ex3_ko = "저의 선생님입니다."
ex3_rd = "わた신의 센세입니다." # No!
ex3_rd = "わたしのせんせいです。"
ex4_jp = "日本語の本です。"
ex4_ko = "일본어 책입니다."
ex4_rd = "にほんごのほんです。"

les2_examples = [
    {"jp": ex3_jp, "ko": ex3_ko, "reading": ex3_rd},
    {"jp": ex4_jp, "ko": ex4_ko, "reading": ex4_rd}
]

sql = f"""
UPDATE vocabulary SET reading = 'がくせい' WHERE word = '学生';

UPDATE grammar_lessons 
SET title = '~は ~입니다', -- keeping title as is for lookup
    example_sentences = '{json.dumps(les1_examples, ensure_ascii=False)}'::jsonb
WHERE title = '~は ~입니다';

UPDATE grammar_lessons 
SET title = '~の', 
    example_sentences = '{json.dumps(les2_examples, ensure_ascii=False)}'::jsonb
WHERE title = '~の' OR title = '~의';
"""

print(sql)
