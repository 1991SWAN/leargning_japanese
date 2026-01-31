
import csv
import uuid
import os

SQL_OUTPUT_PATH = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/import_grammar_final.sql'
CSV_PATH = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/grammar_db_normalized.csv'

def clean_sql(text):
    if not text: return ""
    return text.replace("'", "''")

def generate_import_sql():
    sql_statements = []
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            grammar_id = str(uuid.uuid4())
            pattern = clean_sql(row['pattern'])
            meaning = clean_sql(row['meaning'])
            connection = clean_sql(row['connection'])
            
            # Use float conversion then int for safety (4.0 -> 4)
            try:
                jlpt_level = int(float(row['jlpt level(only number)']))
            except:
                jlpt_level = 5
                
            try:
                conv_level = int(float(row['conversation_level(중요도 별 갯수)']))
            except:
                conv_level = 3
                
            is_core = 'TRUE' if row['is_core'].lower() == 'true' else 'FALSE'
            
            # Insert Parent
            sql_statements.append(
                f"INSERT INTO grammar (id, pattern, meaning, connection, jlpt_level, conversation_level, is_core) "
                f"VALUES ('{grammar_id}', '{pattern}', '{meaning}', '{connection}', {jlpt_level}, {conv_level}, {is_core});"
            )
            
            # Parse Examples (up to 2 in this CSV)
            for i in range(1, 3):
                jp = clean_sql(row.get(f'example{i}(japanes)', ''))
                ko = clean_sql(row.get(f'example{i}(kroean)', ''))
                en = clean_sql(row.get(f'example{i}(english)', ''))
                
                if jp and ko:
                    sql_statements.append(
                        f"INSERT INTO grammar_examples (grammar_id, japanese, korean, english) "
                        f"VALUES ('{grammar_id}', '{jp}', '{ko}', '{en}');"
                    )

    with open(SQL_OUTPUT_PATH, 'w', encoding='utf-8') as out:
        out.write("BEGIN;\n")
        out.write("TRUNCATE TABLE grammar_examples CASCADE;\n")
        out.write("TRUNCATE TABLE grammar CASCADE;\n")
        for stmt in sql_statements:
            out.write(stmt + "\n")
        out.write("COMMIT;\n")
        
    print(f"Generated SQL to {SQL_OUTPUT_PATH}")

if __name__ == "__main__":
    generate_import_sql()
