
import os

AI_DIR = '/home/team/shared/nichepulse/ai'

def fix_broken_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    skip = False
    for line in lines:
        if 'from db_utils import run_team_db' in line:
            new_lines.append(line)
            skip = True
            continue
        
        if skip:
            if line.startswith('def '):
                skip = False
                new_lines.append('
')
                new_lines.append(line)
            continue
        
        new_lines.append(line)
    
    with open(filepath, 'w') as f:
        f.writelines(new_lines)
    print(f"Fixed {filepath}")

broken_files = [
    'synthesize.py',
    'newsletter_generator.py',
    'viral_insight_generator.py',
    'community_signal_gap.py',
    'user_analysis.py'
]

for filename in broken_files:
    fix_broken_file(os.path.join(AI_DIR, filename))
