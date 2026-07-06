import json
import subprocess
import os
import re
from datetime import datetime

from db_utils import run_team_db
def markdown_to_html(md_text):
    # Very basic markdown to HTML conversion
    html = md_text
    
    # Headers
    html = re.sub(r'^# (.*)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    
    # Bold
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    
    # Lists
    # First, handle line breaks for non-list items to avoid merging everything
    lines = html.split('\n')
    in_list = False
    new_lines = []
    for line in lines:
        if line.startswith('- '):
            if not in_list:
                new_lines.append('<ul>')
                in_list = True
            new_lines.append(f'<li>{line[2:]}</li>')
        else:
            if in_list:
                new_lines.append('</ul>')
                in_list = False
            if line.strip():
                # Wrap non-header, non-list lines in <p> if they are not already HTML
                if not line.strip().startswith('<h'):
                    new_lines.append(f'<p>{line}</p>')
                else:
                    new_lines.append(line)
            else:
                new_lines.append('<br/>')
    
    if in_list:
        new_lines.append('</ul>')
        
    return '
'.join(new_lines)

def generate_newsletter():
    # 1. Fetch the latest Daily Brief
    reports = run_team_db("SELECT * FROM reports WHERE type='daily' ORDER BY date DESC LIMIT 1")
    if not reports:
        print("No reports found.")
        return None
    
    report = reports[0]
    content_md = report['content']
    report_date = report['date']
    
    # 2. Convert Markdown to HTML
    content_html = markdown_to_html(content_md)
    
    # 3. Load Template
    template_path = os.path.join(os.path.dirname(__file__), 'newsletter_template.html')
    with open(template_path, 'r') as f:
        template = f.read()
    
    # 4. Populate Template
    newsletter_html = template.replace('{{date}}', report_date)
    newsletter_html = newsletter_html.replace('{{content}}', content_html)
    
    return newsletter_html

if __name__ == "__main__":
    newsletter = generate_newsletter()
    if newsletter:
        # For verification, we can write it to a file or just print the first few characters
        output_path = 'ai/last_generated_newsletter.html'
        with open(output_path, 'w') as f:
            f.write(newsletter)
        print(f"Newsletter generated successfully and saved to {output_path}")
        # print(newsletter[:500] + "...")
