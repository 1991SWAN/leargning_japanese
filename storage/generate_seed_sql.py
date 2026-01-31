import csv
import json
import re

def escape_sql(text):
    if text is None:
        return 'NULL'
    return "'" + text.replace("'", "''") + "'"

def clean_level(level_str):
    if not level_str:
        return '5'
    # Extract digit from 'N5' or just use digit
    match = re.search(r'\d', str(level_str))
    if match:
        return match.group()
    return '5'

def seed_vocab():
    vocab_file = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/JLPT_N5_Vocab_Master.csv'
    sql_statements = []
    
    with open(vocab_file, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            kanji = escape_sql(row['한자']) if row['한자'] else 'NULL'
            furigana = escape_sql(row['후리가나'])
            meaning = escape_sql(row['의미'])
            jlpt_level = clean_level(row['JLPT'])
            pos = escape_sql(row['품사']) if row['품사'] else 'NULL'
            
            # Handling tags ARRAY['tag1']
            tag_val = row['태그']
            if tag_val:
                tags = "ARRAY[" + ", ".join([escape_sql(t.strip()) for t in tag_val.split(',')]) + "]"
            else:
                tags = 'NULL'
            
            sql = f"INSERT INTO public.vocabulary (kanji, furigana, meaning, jlpt_level, part_of_speech, tags) VALUES ({kanji}, {furigana}, {meaning}, {jlpt_level}, {pos}, {tags});"
            sql_statements.append(sql)
    
    return sql_statements

def seed_grammar():
    grammar_file = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/JLPT_N5_Grammar_Master.csv'
    sql_statements = []
    
    with open(grammar_file, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pattern = escape_sql(row['문법패턴'])
            meaning = escape_sql(row['의미'])
            connection = escape_sql(row['접속법']) if row['접속법'] else 'NULL'
            
            examples = []
            if row['예문1_JP']:
                examples.append({"jp": row['예문1_JP'], "ko": row['예문1_KR']})
            if row['예문2_JP']:
                examples.append({"jp": row['예문2_JP'], "ko": row['예문2_KR']})
            
            examples_json = escape_sql(json.dumps(examples, ensure_ascii=False))
            jlpt_level = clean_level(row['레벨'])
            
            sql = f"INSERT INTO public.grammar (pattern, meaning, connection, examples, jlpt_level) VALUES ({pattern}, {meaning}, {connection}, {examples_json}, {jlpt_level});"
            sql_statements.append(sql)
            
    return sql_statements

if __name__ == "__main__":
    vocab_sql = seed_vocab()
    grammar_sql = seed_grammar()
    
    with open('/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/seed_vocab.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(vocab_sql))
        
    with open('/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/seed_grammar.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(grammar_sql))
    
    print(f"Generated {len(vocab_sql)} vocab and {len(grammar_sql)} grammar insert statements.")
