import os
import json
import time
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
    """Fetch accurate prices from CoinGecko - BTC and Gold"""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {"ids": "bitcoin,tether-gold", "vs_currencies": "usd"}
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        return {"btc": data["bitcoin"]["usd"], "gold": data["tether-gold"]["usd"]}
    except Exception as e:
        print(f"Price fetch error: {e}")
        return None

def get_market_data():
    queries = [
        # Breaking News - Prioritise fresh sources
        "site:reuters.com breaking news markets today",
        "site:bloomberg.com markets breaking news",
        "Trump news markets today",
        "breaking financial news today",
        
        # Macro & Geopolitics
        "geopolitical news today risk markets",
        "US China trade tariffs news today",
        "Fed interest rate FOMC latest",
        "economic data CPI PPI today",
        "DXY dollar treasury yield today",
        
        # BTC Regulatory & Flows
        "Bitcoin ETF flows today",
        "SEC crypto news today",
        "bitcoin whale accumulation today",
        
        # BTC Technical
        "bitcoin support resistance today",
        "BTC technical analysis today",
        "crypto fear greed index",
        
        # Gold News & Flows
        "gold price news today",
        "central bank gold buying today",
        "gold ETF flows today",
        
        # Gold Technical
        "gold support resistance levels today",
        "gold technical analysis XAU"
    ]
    
    results = []
    with DDGS() as ddgs:
        for q in queries:
            try:
                r = list(ddgs.text(q, max_results=3))
                results.extend(r)
                time.sleep(0.5)  # Delay between queries to avoid rate limiting
            except Exception as e:
                print(f"DDG query failed for '{q}': {e}")
                continue
    return str(results)

def analyze_market(search_data, live_prices):
    price_info = ""
    if live_prices:
        price_info = f"LIVE PRICES: BTC = ${live_prices['btc']:,.2f}, GOLD = ${live_prices['gold']:,.2f}"
    
    today = datetime.utcnow().strftime("%B %d, %Y")
    
    prompt = f"""
# Role: Senior Crypto Market Analyst & Day Trading Assistant

{price_info}

Search Data: {search_data}

Today's Date: {today}

**Objective:**
Analyse the search data and provide a comprehensive, actionable, data-driven overview of current market conditions for Bitcoin (BTC) and Gold (XAU). Prioritise recent news (last 24-48 hours).

Output ONLY valid JSON in this exact structure:

{{
    "date": "{today}",
    "btc_price": "Current BTC price",
    "gold_price": "Current Gold price per oz",
    
    "macro": {{
        "geopolitics": "Active conflict escalations affecting risk markets",
        "trade": "US/China/EU trade developments if any",
        "fed": "Probability of rate cut/hike at next FOMC meeting",
        "data_releases": "Major economic prints today (CPI, PPI, NFP) or 'None scheduled'",
        "dxy_yields": "DXY (Dollar Index) and 10Y Treasury yield levels and direction"
    }},
    
    "btc": {{
        "price": "Current BTC price",
        "regulatory": {{
            "sec_news": "SEC lawsuits, court rulings in last 24 hours",
            "etf_flows": "Bitcoin ETF inflow/outflow data from yesterday",
            "other": "Any other crypto regulatory news"
        }},
        "whales": {{
            "activity": "Whale accumulation or distribution in last 24 hours",
            "positioning": "Whale long/short ratio if available",
            "notable": "Notable large transactions or wallet movements"
        }},
        "technicals": {{
            "intraday_support": "Immediate support level for day trading",
            "intraday_resistance": "Immediate resistance level for day trading",
            "monthly_support": "Key support established over last 30 days",
            "trend": "Short-term trend: uptrend, downtrend, or chop",
            "chart_note": "Key technical observation"
        }},
        "sentiment": {{
            "fear_greed": "Fear & Greed Index number and status",
            "fear_greed_note": "Context on sentiment",
            "liquidations_up": "Short liquidation cluster levels above price",
            "liquidations_down": "Long liquidation cluster levels below price",
            "narratives": "What Crypto Twitter is focused on today"
        }}
    }},
    
    "gold": {{
        "price": "Current Gold price per oz",
        "flows": {{
            "etf_flows": "Gold ETF (GLD, IAU) inflow/outflow data",
            "central_banks": "Central bank gold buying/selling news",
            "institutional": "Notable institutional gold purchases"
        }},
        "demand": {{
            "physical": "Physical gold demand (China, India, jewelry)",
            "investment": "Investment demand trends",
            "supply": "Mining production or supply news"
        }},
        "technicals": {{
            "intraday_support": "Immediate support level",
            "intraday_resistance": "Immediate resistance level",
            "monthly_support": "Key support established over last 30 days",
            "trend": "Short-term trend description",
            "chart_note": "Key technical observation"
        }},
        "sentiment": {{
            "safe_haven": "Safe haven demand narrative",
            "gold_silver_ratio": "Gold/Silver ratio and what it indicates",
            "narratives": "What gold markets are focused on today"
        }}
    }},
    
    "news_links": [
        {{"title": "Article title from search results", "url": "actual URL from search data"}},
        {{"title": "Article title", "url": "URL"}},
        {{"title": "Article title", "url": "URL"}}
    ],
    
    "bias": "BULLISH or BEARISH or NEUTRAL or WAIT",
    "bias_color": "#00FF00 for bullish, #FF0000 for bearish, #FFFF00 for neutral, #FF9500 for wait",
    "summary": "One actionable sentence summarizing the day's bias and key levels to watch for BTC",
    "updated": "HH:MM UTC"
}}

Important:
- Use ACTUAL data from search results - do not make up prices or levels
- Extract real URLs from the search data for news_links (prioritise Reuters, Bloomberg, FT)
- If specific data not found, say "No recent data"
- Be specific with price levels based on the search data
- Output ONLY valid JSON, no markdown formatting

**Bias Criteria (for BTC):**
- BULLISH: ETF inflows positive + Fear & Greed > 50 + price above key support + no major negative news
- BEARISH: ETF outflows + Fear & Greed < 30 + price below key support + negative regulatory/macro news
- NEUTRAL: Mixed signals, choppy price action, no clear direction
- WAIT: High uncertainty, major event pending (FOMC, CPI), or conflicting signals - best to stay on sidelines
"""
    
    # Retry with exponential backoff for rate limits
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt
            )
            clean_json = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_json)
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 30  # 30s, 60s, 120s - handles minute-based rate limits
                print(f"Gemini API error (attempt {attempt + 1}/{max_retries}): {e}")
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Gemini API failed after {max_retries} attempts: {e}")
                raise

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
        print(f"BTC: ${live_prices['btc']:,.2f}, GOLD: ${live_prices['gold']:,.2f}")
    
    print("Fetching market data...")
    raw_data = get_market_data()
    
    print("Analyzing with Gemini...")
    json_output = analyze_market(raw_data, live_prices)
    
    # Override with accurate prices
    if live_prices:
        json_output["btc_price"] = f"${live_prices['btc']:,.2f}"
        json_output["gold_price"] = f"${live_prices['gold']:,.2f}"
    
    from zoneinfo import ZoneInfo
    london_time = datetime.now(ZoneInfo("Europe/London"))
    json_output["updated"] = london_time.strftime("%H:%M GMT")
    
    print("Updating Gist...")
    update_gist(json_output)
    print("Done!")
