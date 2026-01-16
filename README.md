# Crypto Widget

A free crypto market intelligence system that runs on GitHub Actions, analyzes data with Gemini AI, and displays a full analyst report on my iPhone home screen.

Built by Daniel Wooster.

## What it does

- Runs every 30 minutes on GitHub Actions
- Fetches live prices from CoinGecko
- Scrapes market news, macro data, and sentiment via DuckDuckGo
- Sends everything to Gemini 2.5 Flash for analysis
- Outputs a comprehensive market report to a GitHub Gist
- Displays on iPhone via Scriptable widget

## The Report

When you tap the widget, you get a full analyst report:

- **Macro & Geopolitics** - Fed outlook, trade wars, treasury yields
- **Regulatory** - SEC news, ETF flows
- **Whale Activity** - On-chain accumulation, positioning
- **Technical Levels** - Support/resistance for BTC and ETH
- **Sentiment** - Fear & Greed, liquidation zones, narratives
- **News Links** - Tappable links to source articles

## Stack

Everything is free:

| Component | Service                                |
| --------- | -------------------------------------- |
| Scheduler | GitHub Actions (2,000 mins/month free) |
| Prices    | CoinGecko API (no key needed)          |
| Search    | ddgs Python library                    |
| AI        | Gemini 2.5 Flash                       |
| Storage   | GitHub Gist                            |
| Display   | Scriptable (iOS)                       |

## Files

| File                                 | Purpose                                          |
| ------------------------------------ | ------------------------------------------------ |
| `main.py`                            | Python script that fetches data and calls Gemini |
| `CryptoTick.js`                      | Scriptable widget code                           |
| `.github/workflows/daily_update.yml` | GitHub Action (runs every 30 mins)               |

## Docs

- [Setup Guide](docs/SETUP_GUIDE.md) - How to set this up yourself
- [Limits](docs/LIMITS.md) - Free tier usage and monitoring

## License

MIT
