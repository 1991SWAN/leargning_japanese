
import csv
import json
import re
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    # Fallback to hardcoded values for local execution environment if env file missing
    print("Warning: Env vars not found, checking hardcoded or prompt for credentials.")
    # In this environment, we usually rely on pre-authenticated context or mcp_postgresql.
    # Since we need to run this as a script, we'll generate SQL statements instead of direct connection
    # to avoid dependency on "supabase" python package if not installed, 
    # BUT the user environment has 'mcp_supabase-mcp-server_execute_sql', so generation is safer.
    pass

# We will generate a SQL file to execute via the MCP tool, which is safer and guaranteed to work.
SQL_OUTPUT_PATH = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/restore_grammar_normalized.sql'
CSV_PATH = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/ruby_Supabase Snippet All Grammar Records.csv'

def html_ruby_to_bracket(text):
    if not text: return ""
    # Regex to find <ruby>Kanji<rp>(</rp><rt>Reading</rt><rp>)</rp></ruby>
    # Simplification: <ruby>(.*?)<rp>.*?<rt>(.*?)<\/rt>.*?<\/ruby>
    # Note: Nested ruby is rare in this dataset but standard regex might be fragile.
    # Given the dataset quality, we can assume standard format.
    
    # Pattern: <ruby>BASE<rp>(</rp><rt>READING</rt><rp>)</rp></ruby>
    pattern = re.compile(r'<ruby>(.*?)<rp>.*?</rp><rt>(.*?)</rt><rp>.*?</rp></ruby>')
    
    def replacer(match):
        kanji = match.group(1)
        reading = match.group(2)
        return f"{kanji}[{reading}]"
    
    return pattern.sub(replacer, text)

def generate_migration_sql():
    sql_statements = []
    
    # We need to manually generate UUIDs or let Postgres do it. 
    # Since we are inserting parent then children, we need the parent ID.
    # We can use a DO block or temporary table, OR just generate UUIDs in Python.
    import uuid
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 1. Prepare Grammar Pattern Data
            grammar_id = str(uuid.uuid4())
            pattern = row['pattern'].replace("'", "''")
            meaning = row['meaning'].replace("'", "''")
            connection = row['connection'].replace("'", "''")
            jlpt_level = row['jlpt_level']
            # tags might be empty or string representation of array
            # Assuming CSV tags are like "Tag1,Tag2" or logic needed.
            # Looking at previous SQL dumps, tags is text[].
            tags = row.get('tags', '{}') # format needs check
            
            # Insert Parent
            sql_statements.append(
                f"INSERT INTO grammar (id, pattern, meaning, connection, jlpt_level, tags) "
                f"VALUES ('{grammar_id}', '{pattern}', '{meaning}', '{connection}', {jlpt_level}, "
                f"CASE WHEN '{tags}' = '' THEN '{{}}' ELSE '{tags}' END);"
            )
            
            # 2. Parse Examples (JSON string in CSV)
            examples_raw = row.get('examples', '[]')
            try:
                # Handle double quotes from CSV CSV escaping if needed
                # CSV reader usually handles standard CSV escaping.
                # Assuming the field is a valid JSON string.
                examples = json.loads(examples_raw)
                
                for ex in examples:
                    jp_html = ex.get('jp', '')
                    jp_bracket = html_ruby_to_bracket(jp_html).replace("'", "''")
                    ko = ex.get('ko', '').replace("'", "''")
                    en = ex.get('en', '').replace("'", "''")
                    
                    # Insert Child
                    sql_statements.append(
                        f"INSERT INTO grammar_examples (grammar_id, japanese, korean, english) "
                        f"VALUES ('{grammar_id}', '{jp_bracket}', '{ko}', '{en}');"
                    )
            except Exception as e:
                print(f"Error parsing examples for pattern {pattern}: {e}")
                continue

    # Write to file
    with open(SQL_OUTPUT_PATH, 'w', encoding='utf-8') as out:
        out.write("BEGIN;\n")
        out.write("DELETE FROM grammar_examples;\n") # Cleanup safety
        out.write("DELETE FROM grammar;\n")          # Cleanup safety
        for stmt in sql_statements:
            out.write(stmt + "\n")
        out.write("COMMIT;\n")
        
    print(f"Generated SQL to {SQL_OUTPUT_PATH}")

if __name__ == "__main__":
    generate_migration_sql()
