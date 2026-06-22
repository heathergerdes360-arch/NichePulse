import os
import json
import requests
import feedparser
import uuid
import time
import subprocess
from datetime import datetime, timedelta
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db

def get_clinical_trials():
    print("Fetching longevity trials from ClinicalTrials.gov...")
    # Get trials added/updated in the last 30 days if possible, or just latest 10
    url = "https://clinicaltrials.gov/api/v2/studies?query.term=longevity&pageSize=10&sort=last_update_submitted:desc"
    try:
        response = requests.get(url, timeout=30)
        data = response.json()
        trials = []
        for study in data.get('studies', []):
            protocol = study.get('protocolSection', {})
            id_module = protocol.get('identificationModule', {})
            desc_module = protocol.get('descriptionModule', {})
            trials.append({
                "source": "ClinicalTrials.gov",
                "title": id_module.get('briefTitle') or id_module.get('officialTitle'),
                "content": desc_module.get('briefSummary', 'No summary available.'),
                "url": f"https://clinicaltrials.gov/study/{id_module.get('nctId')}",
                "gap_category": "Longevity Trials"
            })
        return trials
    except Exception as e:
        print(f"Error fetching trials: {e}")
        return []

def get_ctvc_funding():
    print("Fetching Climate Tech VC news...")
    url = "https://www.ctvc.co/rss/"
    try:
        feed = feedparser.parse(url)
        news = []
        # Filter for AI keywords in Climate news
        ai_keywords = ['AI', 'artificial intelligence', 'machine learning', 'data science', 'software', 'digital']
        for entry in feed.entries[:10]:
            is_ai_related = any(kw.lower() in entry.title.lower() or kw.lower() in entry.summary.lower() for kw in ai_keywords)
            if is_ai_related:
                news.append({
                    "source": "Climate Tech VC",
                    "title": entry.title,
                    "content": entry.summary,
                    "url": entry.link,
                    "gap_category": "AI x Climate"
                })
        return news
    except Exception as e:
        print(f"Error fetching CTVC: {e}")
        return []

def get_eu_ai_regulation():
    print("Fetching EU AI Regulation news...")
    # Using the EC Press Corner API for AI related news
    url = "https://ec.europa.eu/commission/presscorner/api/rss?language=en&text=AI%20Act"
    try:
        feed = feedparser.parse(url)
        news = []
        for entry in feed.entries[:5]:
            news.append({
                "source": "EU AI Office / Commission",
                "title": entry.title,
                "content": entry.description,
                "url": entry.link,
                "gap_category": "AI Regulation"
            })
        return news
    except Exception as e:
        print(f"Error fetching EU news: {e}")
        return []

def get_uspto_patents():
    print("Fetching USPTO patents (fallback search)...")
    # Since PatentsView is unreliable today, we use ArXiv filtered for 'patent' and 'climate' or 'AI'
    # or just a placeholder if we can't find a good live source.
    # Actually, let's try a direct PatentsView query again with a different endpoint.
    url = "https://api.patentsview.org/patents/query"
    params = {
        "q": json.dumps({"_and": [{"_text_any": {"patent_title": "AI"}}, {"_text_any": {"patent_title": "Climate"}}]}),
        "f": json.dumps(["patent_number", "patent_title", "patent_date", "patent_abstract"]),
        "o": json.dumps({"page": 1, "per_page": 5})
    }
    try:
        response = requests.get(url, params=params, timeout=20)
        if response.status_code == 200:
            data = response.json()
            patents = []
            for p in data.get('patents', []) or []:
                patents.append({
                    "source": "USPTO",
                    "title": p.get('patent_title'),
                    "content": p.get('patent_abstract') or "No abstract available.",
                    "url": f"https://patents.google.com/patent/US{p.get('patent_number')}",
                    "gap_category": "AI x Climate"
                })
            return patents
    except Exception as e:
        print(f"PatentsView failed: {e}")
    
    # Fallback to ArXiv for high-value research that might be patented
    print("Using ArXiv fallback for high-value research...")
    url = "http://export.arxiv.org/api/query?search_query=all:\"AI\"+AND+all:\"Climate\"&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending"
    try:
        response = requests.get(url, timeout=20)
        feed = feedparser.parse(response.content)
        items = []
        for entry in feed.entries:
            items.append({
                "source": "ArXiv (AI+Climate)",
                "title": entry.title,
                "content": entry.summary,
                "url": entry.link,
                "gap_category": "AI x Climate"
            })
        return items
    except Exception as e:
        print(f"ArXiv fallback failed: {e}")
    return []

def extract_signal_metadata(item):
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            "entities": [],
            "signal_type": "Market news",
            "impact_score": 7,
            "summary": item['content'][:300]
        }
    
    client = OpenAI(api_key=api_key)
    prompt = f"""
    Extract intelligence from this news item:
    Source: {item['source']}
    Category: {item['gap_category']}
    Title: {item['title']}
    Content: {item['content']}
    
    Return JSON with:
    - entities (list of companies, regulators, drugs, technologies)
    - signal_type (one of: regulatory milestone, funding, trial result, patent, enforcement action, research breakthrough)
    - impact_score (1-10 based on: novelty, market size, regulatory significance)
    - summary (concise 1-2 sentence distillation)
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error in LLM extraction: {e}")
        return {"entities": [], "signal_type": "Other", "impact_score": 1, "summary": item['content'][:300]}

def main():
    print(f"--- Signal Gap Ingestion Started at {datetime.now()} ---")
    
    sources = [
        get_clinical_trials,
        get_ctvc_funding,
        get_eu_ai_regulation,
        get_usproto_patents if 'get_usproto_patents' in globals() else get_uspto_patents
    ]
    
    all_items = []
    for source_fn in sources:
        try:
            items = source_fn()
            all_items.extend(items)
            print(f"Collected {len(items)} items from {source_fn.__name__}")
        except Exception as e:
            print(f"Error in {source_fn.__name__}: {e}")
            
    if not all_items:
        print("No new gap signals found.")
        return
        
    print(f"Processing {len(all_items)} gap signals...")
    ingested_count = 0
    for item in all_items:
        try:
            metadata = extract_signal_metadata(item)
            metadata['signal_gap'] = True
            metadata['gap_type'] = item['gap_category']
            
            signal_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            title_esc = item['title'].replace("'", "''")
            content_esc = metadata.get('summary', item['content']).replace("'", "''")
            url_esc = item['url'].replace("'", "''")
            metadata_json = json.dumps(metadata).replace("'", "''")
            
            # Check if URL already exists to avoid duplicates
            check_sql = f"SELECT id FROM signals WHERE url = '{url_esc}'"
            exists = run_team_db(check_sql)
            if exists:
                print(f"Skipping duplicate: {item['title']}")
                continue
                
            sql = f"""
            INSERT INTO signals (id, source, title, content, url, timestamp, category, metadata, importance)
            VALUES ('{signal_id}', '{item['source']}', '{title_esc}', '{content_esc}', '{url_esc}', '{timestamp}', 'signal_gap', '{metadata_json}', {metadata.get('impact_score', 1)})
            """
            run_team_db(sql)
            print(f"Ingested [{item['gap_category']}]: {item['title']}")
            ingested_count += 1
        except Exception as e:
            print(f"Error processing item {item.get('title')}: {e}")

    print(f"--- Signal Gap Ingestion Finished. Ingested {ingested_count} new signals. ---")

if __name__ == "__main__":
    main()
