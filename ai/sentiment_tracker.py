import json
import subprocess
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db

            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return []
        except subprocess.CalledProcessError as e:
            if "Locking error" in e.stderr or "database error" in e.stderr:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"Error running team-db: {e.stderr}")
            return []
    return []

def aggregate_sentiment():
    print("Aggregating sentiment from stories and social signals...")
    yesterday = (datetime.now() - timedelta(days=1)).isoformat()
    
    # 1. Aggregate from stories (Distilled intelligence)
    sql_stories = f"SELECT category, AVG(sentiment_score) as avg_score, COUNT(*) as count FROM stories WHERE created_at > '{yesterday}' GROUP BY category"
    story_results = run_team_db(sql_stories)
    
    # 2. Aggregate from social signals (Raw community sentiment)
    # Note: social_sentiment.py updates 'importance' as sentiment_score * 10
    social_sources = "('reddit', 'hackernews', 'producthunt', 'Twitter')"
    sql_signals = f"SELECT category, AVG(importance/10.0) as avg_score, COUNT(*) as count FROM signals WHERE timestamp > '{yesterday}' AND source IN {social_sources} AND sentiment != '' GROUP BY category"
    signal_results = run_team_db(sql_signals)
    
    # Combine results
    combined = {}
    
    # Add story results
    for res in story_results:
        cat = res['category']
        combined[cat] = {
            'story_score': res['avg_score'],
            'story_count': res['count'],
            'social_score': 0,
            'social_count': 0
        }
        
    # Add signal results
    for res in signal_results:
        cat = res['category']
        if cat not in combined:
            combined[cat] = {
                'story_score': 0,
                'story_count': 0,
                'social_score': res['avg_score'],
                'social_count': res['count']
            }
        else:
            combined[cat]['social_score'] = res['avg_score']
            combined[cat]['social_count'] = res['count']
            
    # Store in sentiment_history
    for cat, data in combined.items():
        # Calculate overall weighted average if needed, or store separate scores in metadata
        total_count = data['story_count'] + data['social_count']
        if total_count == 0: continue
        
        overall_score = (data['story_score'] * data['story_count'] + data['social_score'] * data['social_count']) / total_count
        
        metadata = json.dumps({
            "story_avg": data['story_score'],
            "story_count": data['story_count'],
            "social_avg": data['social_score'],
            "social_count": data['social_count']
        })
        
        timestamp = datetime.now().isoformat()
        # Escaping metadata for SQL
        metadata_escaped = metadata.replace("'", "''")
        
        sql = f"INSERT INTO sentiment_history (category, score, timestamp, count) VALUES ('{cat}', {overall_score}, '{timestamp}', {total_count})"
        run_team_db(sql)
        
        # We might want to update the table to include metadata, but for now we store the overall score.
        print(f"Sector: {cat} | Score: {overall_score:.2f} (Stories: {data['story_count']}, Social: {data['social_count']})")

def main():
    print("--- NichePulse Sentiment Tracker Started ---")
    aggregate_sentiment()
    print("--- NichePulse Sentiment Tracker Finished ---")

if __name__ == "__main__":
    main()
