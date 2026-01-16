import os
import json
import requests
from google import genai
from ddgs import DDGS
from datetime import datetime

# Setup
GENAI_KEY = os.environ["GEMINI_API_KEY"]
GIST_TOKEN = os.environ["GIST_TOKEN"]
GIST_ID = os.environ["GIST_ID"]

client = genai.Client(api_key=GENAI_KEY)

def get_market_data():
    queries = [
        # Prices
        "Bitcoin price today usd",
        "Ethereum price today usd",
        
        # Macro & Geopolitics
        "geopolitical news today risk markets oil gold",
        "US China trade war tariffs latest news",
        "Fed interest rate decision FOMC probability",
        "CPI PPI economic data release today",
        "DXY dollar index 10 year treasury yield today",
        
        # Regulatory
        "SEC crypto lawsuit news today",
        "Bitcoin ETF inflow outflow news today",
        "crypto regulation news today",
        
        # Whale activity
        "bitcoin whale large transaction today",
        "crypto whale buying selling news",
        
        # Technical
        "bitcoin support resistance levels today",
        "ethereum support resistance levels today",
        "bitcoin RSI moving average analysis",
        
        # Sentiment
        "crypto fear and greed index today",
        "bitcoin liquidation heatmap",
        "crypto twitter sentiment today"
    ]
    
    results = []
    with DDGS() as ddgs:
        for q in queries:
            r = list(ddgs.text(q, max_results=3))
            results.extend(r)
    return str(results)

def analyze_market(search_data):
    prompt = f"""
Role: Senior Crypto Market Analyst & Day Trading Assistant

You are analyzing this search data to provide a market overview. Output ONLY valid JSON, no markdown.

Search Data: {search_data}

Analyze the data and output this exact JSON structure:

{{
    "btc_price": "$XX,XXX",
    "eth_price": "$X,XXX",
    
    "macro": {{
        "geopolitics": "Brief summary of any conflict/trade war news affecting markets",
        "fed": "Fed rate outlook and probability info",
        "economic_data": "Any major data releases today (CPI, PPI, NFP)",
        "dxy_yields": "Brief note on dollar/treasury movement"
    }},
    
    "regulatory": {{
        "sec_news": "Any SEC lawsuits or court rulings",
        "etf_flows": "ETF inflow/outflow summary",
        "whale_activity": "Any large whale movements in last 24h"
    }},
    
    "technicals": {{
        "btc_intraday_support": "$XX,XXX",
        "btc_intraday_resistance": "$XX,XXX",
        "btc_1m_support": "$XX,XXX",
        "btc_chart_note": "Brief technical observation",
        "eth_intraday_support": "$X,XXX",
        "eth_intraday_resistance": "$X,XXX",
        "eth_1m_support": "$X,XXX",
        "eth_chart_note": "Brief technical observation"
    }},
    
    "sentiment": {{
        "fear_greed": "XX - Status (e.g. 72 - Greed)",
        "liquidations": "Note on liquidation clusters if available",
        "narratives": "What crypto twitter is focused on today"
    }},
    
    "news_links": [
        {{"title": "Article title 1", "url": "https://..."}},
        {{"title": "Article title 2", "url": "https://..."}},
        {{"title": "Article title 3", "url": "https://..."}}
    ],
    
    "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
    "bias_color": "#00FF00" (if bullish) | "#FF0000" (if bearish) | "#FFFF00" (if neutral),
    "summary": "One sentence actionable insight (e.g. 'Cautiously bullish - Fed pause likely, but watch $94k support')",
    "updated": "HH:MM UTC"
}}

Important:
- Use actual data from the search results where available
- If data is not found, say "No recent data" rather than making it up
- Keep each field concise
- Output ONLY the JSON, no extra text or markdown blocks
"""
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    clean_json = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(clean_json)

def update_gist(data):
    headers = {"Authorization": f"token {GIST_TOKEN}"}
    payload = {
        "files": {
            "crypto_data.json": {
                "content": json.dumps(data, indent=2)
            }
        }
    }
    requests.patch(f"https://api.github.com/gists/{GIST_ID}", json=payload, headers=headers)

if __name__ == "__main__":
    print("Starting analysis...")
    raw_data = get_market_data()
    print("Data fetched. Analyzing...")
    json_output = analyze_market(raw_data)
    json_output["updated"] = datetime.utcnow().strftime("%H:%M UTC")
    print("Analysis complete. Updating Gist...")
    update_gist(json_output)
    print("Done!")
