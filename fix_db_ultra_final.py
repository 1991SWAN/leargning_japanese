import json

# Unicode for Japanese
de = "\u3067"
su = "\u3059"
period_ja = "\u3002"
desu_ja = de + su + period_ja

wa_ja = "\u306f"
watashi_ja = "\u308f\u305f\u3057"
gakusei_kanji = "\u5b66\u751f"
gakusei_kana = "\u304c\u304f\u305b\u3044"
hon_kanji = "\u672c"
hon_kana = "\u307b\u3093"
sensei_kanji = "\u5148\u751f"
sensei_kana = "\u305b\u3093\u305b\u3044"
kore_kana = "\u3053\u308c"
nihongo_kanji = "\u65e5\u672c\u8a9e"
nihongo_kana = "\u306b\u307b\u3093\u3054"
no_ja = "\u306e"

# Vocabulary fix
vocab_sql = f"UPDATE vocabulary SET reading = '{gakusei_kana}' WHERE word = '{gakusei_kanji}';"

# Lesson 1
les1_examples = [
    {
        "jp": f"\u79c1{wa_ja}{gakusei_kanji}{desu_ja}",
        "ko": "나는 학생입니다.",
        "reading": f"{watashi_ja}{wa_ja}{gakusei_kana}{desu_ja}"
    },
    {
        "jp": f"{kore_kana}{wa_ja}{hon_kanji}{desu_ja}",
        "ko": "이것은 책입니다.",
        "reading": f"{kore_kana}{wa_ja}{hon_kana}{desu_ja}"
    }
]

# Lesson 2
les2_examples = [
    {
        "jp": f"\u79c1{no_ja}{sensei_kanji}{desu_ja}",
        "ko": "저의 선생님입니다.",
        "reading": f"{watashi_ja}{no_ja}{sensei_kana}{desu_ja}"
    },
    {
        "jp": f"{nihongo_kanji}{no_ja}{hon_kanji}{desu_ja}",
        "ko": "일본어 책입니다.",
        "reading": f"{nihongo_kana}{no_ja}{hon_kana}{desu_ja}"
    }
]

sql = f"""
UPDATE vocabulary SET reading = '{gakusei_kana}' WHERE word = '{gakusei_kanji}';

UPDATE grammar_lessons 
SET example_sentences = '{json.dumps(les1_examples, ensure_ascii=False)}'::jsonb
WHERE title = '~は ~입니다';

UPDATE grammar_lessons 
SET example_sentences = '{json.dumps(les2_examples, ensure_ascii=False)}'::jsonb
WHERE title = '~의' OR title = '~의' OR title = '~의' OR title = '~의' OR title = '~の';
"""

print(sql)
