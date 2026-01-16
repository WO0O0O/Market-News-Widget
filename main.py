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

def get_live_prices():
    """Fetch accurate prices from CoinGecko"""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {"ids": "bitcoin,ethereum", "vs_currencies": "usd"}
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        return {"btc": data["bitcoin"]["usd"], "eth": data["ethereum"]["usd"]}
    except Exception as e:
        print(f"Price fetch error: {e}")
        return None

def get_market_data():
    queries = [
        # Macro & Geopolitics
        "geopolitical news today risk markets oil gold conflict",
        "US China trade war tariffs latest news",
        "Fed interest rate decision FOMC probability January 2026",
        "CPI PPI economic data release today",
        "DXY dollar index 10 year treasury yield today",
        
        # Regulatory
        "SEC crypto lawsuit news today",
        "Bitcoin ETF inflow outflow news today",
        "crypto regulation news today",
        
        # Whale activity
        "bitcoin whale large transaction today on-chain",
        "crypto whale buying selling news accumulation",
        
        # Technical
        "bitcoin support resistance levels analysis today",
        "ethereum support resistance levels analysis today",
        "bitcoin technical analysis RSI EMA today",
        "BTC price prediction range today",
        
        # Sentiment
        "crypto fear and greed index today",
        "bitcoin liquidation heatmap short squeeze",
        "crypto twitter sentiment narrative today"
    ]
    
    results = []
    with DDGS() as ddgs:
        for q in queries:
            r = list(ddgs.text(q, max_results=3))
            results.extend(r)
    return str(results)

def analyze_market(search_data, live_prices):
    price_info = ""
    if live_prices:
        price_info = f"LIVE PRICES: BTC = ${live_prices['btc']:,.2f}, ETH = ${live_prices['eth']:,.2f}"
    
    today = datetime.utcnow().strftime("%B %d, %Y")
    
    prompt = f"""
Role: Senior Crypto Market Analyst & Day Trading Assistant

{price_info}

Search Data: {search_data}

Today's Date: {today}

Analyze the search data and create a comprehensive market analysis report. Output ONLY valid JSON:

{{
    "date": "{today}",
    "btc_price": "${live_prices['btc']:,.2f}" if available,
    "eth_price": "${live_prices['eth']:,.2f}" if available,
    
    "macro": {{
        "geopolitics": "2-3 sentences on active conflicts, NATO tensions, or regional issues affecting risk assets",
        "trade": "Any trade war developments, tariff news, or supply chain impacts",
        "fed": "Fed rate decision probability and outlook (e.g. '82-95% chance of HOLD at Jan FOMC')",
        "data_releases": "Any major economic prints today (CPI, NFP, PPI) or note if none",
        "dxy_yields": "10Y Treasury yield level and DXY movement (e.g. '10Y at 4.17%, DXY at 99.10')"
    }},
    
    "regulatory": {{
        "sec_news": "Any SEC lawsuits, court rulings, or enforcement actions",
        "etf_flows": "Bitcoin ETF inflow/outflow data from yesterday",
        "other": "Any other regulatory news (regional bans, new bills, etc.)"
    }},
    
    "whales": {{
        "activity": "On-chain whale accumulation or distribution data",
        "positioning": "Whale long/short ratio if available",
        "notable": "Any notable large transactions or wallet movements"
    }},
    
    "technicals": {{
        "btc_price": "${live_prices['btc']:,.2f}" if available,
        "btc_intraday_support": "$XX,XXX",
        "btc_intraday_resistance": "$XX,XXX",
        "btc_1m_support": "$XX,XXX",
        "btc_trend": "Trend description (e.g. 'Consolidating between $95k-$98k')",
        "btc_chart_note": "Key technical observation",
        "eth_price": "${live_prices['eth']:,.2f}" if available,
        "eth_intraday_support": "$X,XXX",
        "eth_intraday_resistance": "$X,XXX", 
        "eth_1m_support": "$X,XXX",
        "eth_trend": "Trend description",
        "eth_chart_note": "Key technical observation (e.g. 'Lagging BTC, stuck in range')"
    }},
    
    "sentiment": {{
        "fear_greed": "XX - Status (e.g. 61 - Greed)",
        "fear_greed_note": "Context on sentiment shift",
        "liquidations_up": "Short liquidation cluster level (e.g. '$97k-$98k')",
        "liquidations_down": "Long liquidation cluster level (e.g. 'Below $95k')",
        "narratives": "What crypto twitter/traders are focused on today"
    }},
    
    "news_links": [
        {{"title": "Article 1", "url": "https://..."}},
        {{"title": "Article 2", "url": "https://..."}},
        {{"title": "Article 3", "url": "https://..."}},
        {{"title": "Article 4", "url": "https://..."}},
        {{"title": "Article 5", "url": "https://..."}}
    ],
    
    "bias": "BULLISH" | "BEARISH" | "NEUTRAL" | "WAIT",
    "bias_color": "#00FF00" (bullish) | "#FF0000" (bearish) | "#FFFF00" (neutral) | "#FF9500" (wait),
    "summary": "One actionable sentence (e.g. 'Wait for volatility - avoid chopping in $95k-$98k range, wait for breakout above $98.1k or breakdown below $95k')",
    "updated": "HH:MM UTC"
}}

Important:
- Use actual data from search results
- If specific data not found, provide reasonable context or say "No recent data"
- Be specific with price levels and percentages
- Keep analysis actionable for day traders
- Output ONLY JSON, no markdown
"""
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
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
    print("Fetching live prices...")
    live_prices = get_live_prices()
    if live_prices:
        print(f"BTC: ${live_prices['btc']:,.2f}, ETH: ${live_prices['eth']:,.2f}")
    
    print("Fetching market data...")
    raw_data = get_market_data()
    
    print("Analyzing with Gemini...")
    json_output = analyze_market(raw_data, live_prices)
    
    # Override with accurate prices
    if live_prices:
        json_output["btc_price"] = f"${live_prices['btc']:,.2f}"
        json_output["eth_price"] = f"${live_prices['eth']:,.2f}"
    
    json_output["updated"] = datetime.utcnow().strftime("%H:%M UTC")
    
    print("Updating Gist...")
    update_gist(json_output)
    print("Done!")
