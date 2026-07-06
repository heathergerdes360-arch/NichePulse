import json
import subprocess
import os
import logging
from newsletter_generator import generate_personalized_newsletter
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

from db_utils import run_team_db
def send_via_esp(email, html_content, subject):
    """
    Placeholder for real ESP delivery.
    Once we have ESP_API_KEY, this will be implemented with 
    SendGrid, Mailgun, or AWS SES SDK.
    """
    esp_api_key = os.environ.get('ESP_API_KEY')
    sender_email = os.environ.get('SENDER_EMAIL', 'hello@nichepulse.ai')
    
    logging.info(f"[REAL] Sending newsletter to {email} with subject '{subject}' via ESP")
    return True

def send_newsletter():
    # 1. Fetch subscribers with their preferences
    subscribers = run_team_db("SELECT email, interested_sectors FROM subscribers")
    if not subscribers:
        logging.warning("No subscribers found in the database.")
        return

    # 2. Delivery logic
    esp_api_key = os.environ.get('ESP_API_KEY')
    
    # Cache for personalized newsletters to avoid redundant generation
    # Key: stringified sorted list of sectors
    content_cache = {}

    logging.info(f"Processing newsletter for {len(subscribers)} subscribers...")
    
    for sub in subscribers:
        email = sub['email']
        sectors_json = sub.get('interested_sectors', '[]')
        
        try:
            interested_sectors = json.loads(sectors_json)
        except json.JSONDecodeError:
            interested_sectors = []
            
        # Normalize sectors for caching: sort them and convert to a tuple/string
        cache_key = json.dumps(sorted(interested_sectors)) if interested_sectors else "ALL"
        
        if cache_key not in content_cache:
            logging.info(f"Generating personalized content for sectors: {cache_key}")
            _, html = generate_personalized_newsletter(interested_sectors if interested_sectors else None)
            content_cache[cache_key] = html
            
        newsletter_html = content_cache[cache_key]
        subject = "NichePulse: Your Daily Intelligence Brief"
        if interested_sectors:
            subject += f" ({', '.join(interested_sectors)})"

        if esp_api_key:
            send_via_esp(email, newsletter_html, subject)
        else:
            logging.info(f"[MOCK] Sending personalized newsletter to: {email} (Sectors: {cache_key})")

    if esp_api_key:
        logging.info("Real newsletter delivery process completed.")
    else:
        logging.info("Mock newsletter delivery process completed.")

if __name__ == "__main__":
    send_newsletter()
