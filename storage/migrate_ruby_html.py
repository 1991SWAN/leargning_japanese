import csv
import json
import os

# 파일 경로 설정
csv_path = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/ruby_Supabase Snippet All Grammar Records.csv'

def migrate():
    updates = []
    
    # CSV 읽기
    with open(csv_path, 'r', encoding='utf-8') as f:
        # 첫 번째 라인 'examples' 헤더 스킵
        next(f)
        reader = csv.reader(f)
        
        for row in reader:
            if not row: continue
            raw_json = row[0]
            try:
                # JSON 내의 더블 쿼트 이스케이프 처리 ("" -> ")
                clean_json = raw_json.replace('""', '"')
                examples_data = json.loads(clean_json)
                
                # 매칭을 위한 기준값 (첫 번째 예문의 ko)
                match_ko = examples_data[0]['ko']
                
                # SQL 생성 (examples 전체를 교체)
                # JSON 데이터를 SQL 문자열로 안전하게 변환
                json_str = json.dumps(examples_data, ensure_ascii=False).replace("'", "''")
                
                # ko 값을 기준으로 dapper sql 생성
                sql = f"UPDATE grammar SET examples = '{json_str}'::jsonb WHERE (examples->0->>'ko') = '{match_ko}';"
                updates.append(sql)
                
            except Exception as e:
                print(f"Error parsing row: {e}")

    # SQL 파일 저장
    output_path = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/restore_ruby_final.sql'
    with open(output_path, 'w', encoding='utf-8') as f:
        for sql in updates:
            f.write(sql + '\n')
    
    print(f"Generated {len(updates)} SQL update statements in {output_path}")

if __name__ == '__main__':
    migrate()
