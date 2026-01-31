import json

ex1_jp = "私は학생입니다." # No!
ex1_jp = "私は学生です。"
ex1_rd = "わたしはがくせいです。"
ex1_ko = "나는 학생입니다."

ex2_jp = "これは本입니다." # No!
ex2_jp = "これは本입니다." # No!!
ex2_jp = "これは本です。"
ex2_rd = "이는 ほんです。" # No!
ex2_rd = "これはほんです。"
ex2_ko = "이것은 책입니다."

ex3_jp = "私の先生입니다." # No!
ex3_jp = "私の先生입니다." # No!!
ex3_jp = "私の先生です。"
ex3_rd = "わたしのせん세입니다." # No!
ex3_rd = "わたしのせん세いです。" # No!!
ex3_rd = "わたしのせんせいです。"
ex3_ko = "저의 선생님입니다."

ex4_jp = "日本語の本습니다." # No!
ex4_jp = "日本語の本입니다." # No!!
ex4_jp = "日本語の本です。"
ex4_rd = "에혼고노 ほんです。" # No!
ex4_rd = "にほんごのほんです。"
ex4_ko = "일본어 책입니다."

les1 = [
    {"jp": ex1_jp, "ko": ex1_ko, "reading": ex1_rd},
    {"jp": ex2_jp, "ko": ex2_ko, "reading": ex2_rd}
]

les2 = [
    {"jp": ex3_jp, "ko": ex3_ko, "reading": ex3_rd},
    {"jp": ex4_jp, "ko": ex4_ko, "reading": ex4_rd}
]

sql = f"""
UPDATE vocabulary SET reading = 'がくせい' WHERE word = '学生';

UPDATE grammar_lessons 
SET example_sentences = '{json.dumps(les1, ensure_ascii=False)}'::jsonb
WHERE title = '~は ~입니다';

UPDATE grammar_lessons 
SET example_sentences = '{json.dumps(les2, ensure_ascii=False)}'::jsonb
WHERE title = '~의' OR title = '~の';
"""

print(sql)
