import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def identify_signal_connections(stories):
    """
    Identifies non-obvious links between different intelligence signals across sectors.
    """
    if not stories:
        return ""

    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        return identify_connections_fallback(stories)

    client = OpenAI(api_key=api_key)
    
    # Prepare stories for LLM
    stories_data = []
    for s in stories:
        stories_data.append({
            "title": s.get('title'),
            "category": s.get('category'),
            "summary": s.get('summary'),
            "importance": s.get('importance_score')
        })
    
    stories_json = json.dumps(stories_data, indent=2)
    
    prompt = f"""
    You are a high-level strategic analyst for NichePulse, an intelligence platform for professional investors and founders.
    Your task is to identify NON-OBVIOUS cross-sector connections between today's intelligence signals.
    
    Maintain professional grammar and avoid double negatives (e.g., use "without any" instead of "without no").

    Look for:
    - How a regulatory change in one sector (e.g., AI) might impact funding or development in another (e.g., Biotech, Climate Tech).
    - How a technical breakthrough in one area could be the 'missing piece' for a challenge in another area (e.g., how Geroscience trial data could inform AI-driven drug discovery models).
    - Second-order effects that mainstream news is likely to miss.
    - Market convergence trends between AI, Longevity, and Decarbonization.
    
    Input Stories:
    {stories_json}
    
    Output Format:
    - Return a Markdown section titled "## 💎 Premium Deep-Dive: Signal Connections".
    - Provide 2-3 specific, high-value insights.
    - Each insight should have a catchy title and a 2-3 sentence explanation of the connection and its strategic implication.
    - Use a professional, high-conviction tone.
    - If no significant non-obvious connections are found, return a brief note about market convergence trends.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "You are a strategic intelligence analyst."},
                      {"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling LLM for signal connections: {e}")
        return identify_connections_fallback(stories)

def identify_connections_fallback(stories):
    """
    Rule-based fallback for identifying connections when LLM is unavailable.
    """
    connections = []
    
    # Simple keyword-based cross-sector matching
    categories = set(s.get('category', '').lower() for s in stories)
    
    if ('ai' in categories or 'ai' in categories) and ('climate' in categories or 'climate tech' in categories):
        connections.append({
            "title": "AI-Driven Decarbonization Acceleration",
            "body": "The convergence of advanced AI reasoning models and grid-scale energy management signals a shift toward autonomous carbon sequestration monitoring. This creates a high-conviction window for Climate Tech startups utilizing frontier AI architectures."
        })
    
    if 'ai' in categories and ('biotech' in categories or 'longevity' in categories):
        # Look for regulatory keywords
        all_text = " ".join([s.get('title', '') + " " + s.get('summary', '') for s in stories]).lower()
        if any(word in all_text for word in ["regulation", "regulatory", "policy", "fda"]):
            connections.append({
                "title": "Cross-Sector Regulatory Spillover",
                "body": "Emerging AI safety regulations are beginning to influence computational biology compliance frameworks. We anticipate that 'explainability' requirements for frontier models will soon be mandated for AI-driven clinical trial designs, impacting Biotech speed-to-market."
            })
        else:
            connections.append({
                "title": "AI-Driven Geroscience Synthesis",
                "body": "Emerging readouts from niche geroscience trials are providing the high-fidelity longitudinal data required to train next-generation AI drug discovery models. We identify a strategic opportunity for platforms connecting clinical trial 'exhaust' to generative biology pipelines."
            })
    
    if 'ai' in categories and 'signal_gap' in categories:
        connections.append({
            "title": "Generative Biology Regulatory Tailwinds",
            "body": "As the EU AI Office clarifies high-risk classification for generative models, we anticipate a spillover effect into FDA approval timelines for AI-designed proteins. Strategic alignment with 'explainable AI' in biotech is now a critical de-risking factor."
        })

    if 'longevity' in categories or 'signal_gap' in categories:
        connections.append({
            "title": "Longevity Capital Flight",
            "body": "Increased volatility in traditional tech funding is driving 'patient capital' toward longevity clinical trials. Our tracking of niche regulatory gaps suggests that longevity-focused biotech is becoming the new safe haven for long-term venture deployment."
        })

    if 'defensetech' in categories and 'tech' in categories:
        connections.append({
            "title": "Dual-Use Supply Chain Convergence",
            "body": "New export controls on high-performance semiconductors are forcing a convergence between DefenseTech procurement and general enterprise AI hardware strategies. We identify a strategic need for 'sovereign compute' clusters that bridge this gap."
        })

    if not connections:
        return """## 💎 Premium Deep-Dive: Signal Connections

No significant cross-sector convergences identified in today's limited signal stream. Monitoring second-order effects of recent regulatory shifts."""

    md = """## 💎 Premium Deep-Dive: Signal Connections

"""
    for conn in connections[:3]:
        md += f"### {conn['title']}\n{conn['body']}\n\n"
    
    return md
