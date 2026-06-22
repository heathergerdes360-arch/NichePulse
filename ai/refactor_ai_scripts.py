
import os
import re

AI_DIR = '/home/team/shared/nichepulse/ai'
DB_UTILS_IMPORT = 'from db_utils import run_team_db
'

def refactor_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Pattern to match the run_team_db function
    # It usually starts with from db_utils import run_team_db

    pattern = re.compile(r'def run_team_db\(.*?\):.*?return \[\]', re.DOTALL)
    
    if pattern.search(content):
        new_content = pattern.sub(DB_UTILS_IMPORT, content)
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Refactored {filepath}")
    else:
        # Check if it already has the import
        if 'from db_utils import run_team_db' not in content:
            print(f"Could not find run_team_db function in {filepath}")

for filename in os.listdir(AI_DIR):
    if filename.endswith('.py') and filename != 'db_utils.py':
        refactor_file(os.path.join(AI_DIR, filename))
