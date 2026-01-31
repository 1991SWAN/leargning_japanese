import json

# Unicode escape for "がくせい"
# が: \u304c, く: \u304f, せ: \u305b, い: \u3044
gakusei = "\u304c\u304f\u305b\u3044"

# 私は学生です。
# 私: \u79c1, は: \u306f, 学: \u5b66, 生: \u751f, で: \u3067, す: \u3059, 。: \u3002
ex1_jp = "\u79c1\u306f\u5b66\u751f\u3067\u3059\u3002"
ex1_rd = "\u308f\u305f\u3057\u306f\u304c\u304f\u305b\u3044\u3067\u3059\u3002"
ex1_ko = "나는 학생입니다."

# これは本です。
# こ: \u3053, れ: \u308c, は: \u306f, 本: \u672c, で: \u3067, す: \u3059, 。: \u3002
ex2_jp = "\u3053\u308c\u306f\u672c\u3067\u3059\u3002"
ex2_rd = "\u3053\u308c\u306f\u307b\u3093\u3067\u3059\u3002"
ex2_ko = "이것은 책입니다."

# 私の先生です。
# 私: \u79c1, の: \u306e, 先: \u5148, 生: \u751f, で: \u3067, す: \u3059, 。: \u3002
ex3_jp = "\u79c1\u306e\u5148\u751f\u3067\u3059\u3002"
ex3_rd = "\u308f\u305f\u3057\u306e\u305b\u3093\u305b\u3044\u3067\u3059\u3002"
ex3_ko = "저의 선생님입니다."

# 日本語の本입니다. -> No! 日本語の本です。
# 日: \u65e5, 本: \u672c, 語: \u8a9e, の: \u306e, 本: \u672c, で: \u3067, す: \u3059, 。: \u3002
ex4_jp = "\u65e5\u672c\u8a9e\u306e\u672c\u3067\u3059\u3002"
ex4_rd = "\u306b\u307b\u3093\u3054\u306e\u307b\u3093\u3067\u3059\u3002"
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
UPDATE vocabulary SET reading = '{gakusei}' WHERE word = '学生';

UPDATE grammar_lessons 
SET example_sentences = '{json.dumps(les1, ensure_ascii=False)}'::jsonb
WHERE title = '~は ~입니다';

UPDATE grammar_lessons 
SET example_sentences = '{json.dumps(les2, ensure_ascii=False)}'::jsonb
WHERE title = '~의' OR title = '~의' OR title = '~의' OR title = '~의' OR title = '~の';
"""

print(sql)
