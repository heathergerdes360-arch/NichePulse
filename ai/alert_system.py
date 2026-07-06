import json
import subprocess
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from db_utils import run_team_db
def get_sentiment_shifts():
    # Get all sectors
    sectors_res = run_team_db("SELECT DISTINCT sector FROM sentiment_history")
    sectors = [s['sector'] for s in sectors_res]
    
    alerts = []
    
    for sector in sectors:
        # Get latest record (the one just created by the tracker)
        current_res = run_team_db(f"SELECT avg_sentiment, created_at FROM sentiment_history WHERE sector = '{sector}' ORDER BY created_at DESC LIMIT 1")
        if not current_res:
            continue
        current = current_res[0]
        
        # Get record from ~24 hours ago
        previous_res = run_team_db(f"SELECT avg_sentiment, created_at FROM sentiment_history WHERE sector = '{sector}' AND created_at < datetime('now', '-23 hours') ORDER BY created_at DESC LIMIT 1")
        
        if not previous_res:
            # Fallback to the previous one if nothing older than 23h found
            previous_res = run_team_db(f"SELECT avg_sentiment, created_at FROM sentiment_history WHERE sector = '{sector}' ORDER BY created_at DESC LIMIT 1 OFFSET 1")
            if not previous_res:
                continue
            
        previous = previous_res[0]
        
        curr_val = current['avg_sentiment']
        prev_val = previous['avg_sentiment']
        
        diff = curr_val - prev_val
        abs_diff = abs(diff)
        
        # Criteria: change > 0.2 units OR > 20%
        significant = False
        if abs_diff >= 0.2:
            significant = True
        elif prev_val != 0 and (abs_diff / abs(prev_val)) >= 0.2:
            significant = True
            
        if significant:
            alert_type = "spike" if diff > 0 else "dip"
            direction = "improved" if diff > 0 else "declined"
            message = f"Sentiment for {sector} has {direction} significantly by {abs_diff:.2f} units (from {prev_val:.2f} to {curr_val:.2f})."
            
            alerts.append({
                "sector": sector,
                "alert_type": alert_type,
                "message": message,
                "current_sentiment": curr_val,
                "previous_sentiment": prev_val
            })
            
    return alerts

def save_alert(sector, alert_type, message):
    alert_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    message_escaped = message.replace("'", "''")
    
    sql = f"INSERT INTO alerts (id, sector, alert_type, message, created_at) VALUES ('{alert_id}', '{sector}', '{alert_type}', '{message_escaped}', '{created_at}')"
    run_team_db(sql)
    return alert_id

def send_mock_emails(alerts):
    if not alerts:
        return
        
    premium_subs = run_team_db("SELECT email FROM subscribers WHERE is_premium = 1")
    if not premium_subs:
        print("No premium subscribers found to notify.")
        return
        
    for sub in premium_subs:
        email = sub['email']
        print(f"[MOCK EMAIL to {email}] SUBJECT: NichePulse Sentiment Alert!")
        print("The following significant market sentiment shifts were detected in the last 24 hours:")
        for alert in alerts:
            print(f" - [{alert['sector'].upper()}] {alert['alert_type'].upper()}: {alert['message']}")
        print("-" * 30)

def main():
    print("--- Sentiment Alert System ---")
    print(f"Time: {datetime.now().isoformat()}")
    
    shifts = get_sentiment_shifts()
    
    if not shifts:
        print("No significant sentiment shifts detected.")
        return
        
    for shift in shifts:
        print(f"Triggering alert for {shift['sector']}: {shift['alert_type']}")
        save_alert(shift['sector'], shift['alert_type'], shift['message'])
        
    send_mock_emails(shifts)
    print("Alert processing completed.")

if __name__ == "__main__":
    main()
