
import json
import subprocess
import time

def run_team_db(sql, retries=5):
    """
    Executes a SQL query using the team-db CLI with retry logic for transient errors.
    """
    last_error = None
    delay = 0.5 # Start with 500ms delay

    for attempt in range(retries + 1):
        try:
            result = subprocess.run(['team-db', sql], capture_output=True, text=True)
            
            if result.returncode == 0:
                stdout = result.stdout.strip()
                if not stdout:
                    return []
                try:
                    return json.loads(stdout)
                except json.JSONDecodeError:
                    # For non-SELECT queries, it might not return JSON
                    return []
            
            err = (result.stderr or "") + (result.stdout or "")
            last_error = Exception(f"team-db failed with return code {result.returncode}: {err}")
            
            # Determine if error is transient/retryable
            is_transient = any(x in err for x in [
                "Locking error", 
                "sync engine operation failed", 
                "unable to checkpoint", 
                "database is locked"
            ])

            if not is_transient:
                print(f"Permanent DB Error: {err}")
                return []

            print(f"Database transient error (attempt {attempt + 1}/{retries + 1}), retrying in {delay}s...")
            if attempt < retries:
                time.sleep(delay)
                delay *= 2 # Exponential backoff
                
        except Exception as e:
            last_error = e
            print(f"Exception running team-db: {e}")
            if attempt < retries:
                time.sleep(delay)
                delay *= 2
    
    print(f"Database query failed after {retries + 1} attempts. Last error: {last_error}")
    return []
