import csv
import re

file_path = '/Users/apple/macWork/macCoding/vivecoding/01_antigravity/02_learning_japanese/storage/JLPT_N5_Grammar_Master.csv'

kr_pattern = re.compile(r'[가-힣]')

problems = []
with open(file_path, mode='r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    next(reader) # skip header
    for row in reader:
        # 4: JP Ex 1, 6: JP Ex 2
        if kr_pattern.search(row[4]) or kr_pattern.search(row[6]):
            problems.append(row)

for p in problems:
    print(f"Row {p[0]}: JP1='{p[4]}', JP2='{p[6]}'")
