# Usage Limits & Monitoring

Quick reference for free tier limits and expected usage.

---

## GitHub Actions

| Metric        | Free Tier Limit | Your Usage      |
| ------------- | --------------- | --------------- |
| Minutes/month | 2,000           | ~15-30 mins     |
| Runs/month    | -               | ~510            |
| Frequency     | -               | Hourly 6am-10pm |

**Calculation:**

- Hourly from 6am-10pm UTC = 17 runs/day = ~510 runs/month
- Each run ~30-60 seconds
- Monthly usage: ~255-510 minutes (well under 2,000)

**Monitor:** [GitHub Actions Usage](https://github.com/settings/billing)

---

## Gemini API (Free Tier)

| Metric       | Free Tier Limit | Your Usage |
| ------------ | --------------- | ---------- |
| Requests/min | 10              | 1          |
| Requests/day | 20              | 17         |
| Tokens/min   | 250,000         | ~10,000    |

**Model:** gemini-2.5-flash-lite

> **Note:** Hourly updates from 6am-10pm UTC = 17 requests/day, staying within the 20 RPD limit.

**Monitor:** [Gemini Rate Limits](https://ai.dev/rate-limit)

---

## CoinGecko API (Free, No Key)

| Metric       | Limit     | Your Usage |
| ------------ | --------- | ---------- |
| Requests/min | 10-30     | 1          |
| Requests/day | Unlimited | 17         |

No API key required for basic price endpoint.

---

## DuckDuckGo Search

| Metric     | Limit      | Your Usage      |
| ---------- | ---------- | --------------- |
| Rate limit | Soft limit | ~23 queries/run |

No API key. Uses ddgs Python library (web scraping).

---

## GitHub Gist

| Metric    | Limit     |
| --------- | --------- |
| File size | 10 MB     |
| Gists     | Unlimited |

Your JSON file is ~2-3 KB — no concerns.

---

## Expected Monthly Summary

| Service        | Expected Usage | % of Free Tier |
| -------------- | -------------- | -------------- |
| GitHub Actions | ~30 mins       | 1.5%           |
| Gemini API     | ~17 requests   | 85% of daily   |
| CoinGecko      | ~510 requests  | N/A (no limit) |

**Verdict:** Staying within all free tier limits.

---

## Secrets Stored

| Secret         | Location            | Purpose           |
| -------------- | ------------------- | ----------------- |
| GEMINI_API_KEY | GitHub Repo Secrets | Gemini API access |
| GIST_TOKEN     | GitHub Repo Secrets | Update Gist       |
| GIST_ID        | GitHub Repo Secrets | Gist identifier   |

---

## Monitoring Links

- [GitHub Actions Runs](https://github.com/WO0O0O/BOLD-widget/actions)
- [Gemini Rate Limits](https://ai.dev/rate-limit)
- [Your Gist](https://gist.github.com/WO0O0O/43171059615e0008db423e0ace9e8e6a)

---

## If Something Breaks

| Issue             | Likely Cause                   | Fix                        |
| ----------------- | ------------------------------ | -------------------------- |
| Workflow fails    | API rate limit or bad response | Wait 15 mins, retry        |
| Gist not updating | Token expired                  | Regenerate PAT             |
| Prices wrong      | CoinGecko down                 | Will auto-recover next run |
| Widget error      | JSON structure changed         | Check Gist data            |
