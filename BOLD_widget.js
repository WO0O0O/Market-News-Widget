// Bold_widget - by Daniel Wooster
// BTC & Gold Market Analysis

const GIST_URL =
  "https://gist.githubusercontent.com/WO0O0O/43171059615e0008db423e0ace9e8e6a/raw/crypto_data.json";

const req = new Request(GIST_URL);
const data = await req.loadJSON();

if (config.runsInWidget) {
  Script.setWidget(await createWidget(data));
} else {
  await showDetailView(data);
}
Script.complete();

// ═══════════════════════════════════════════════════════════════
// WIDGET VIEW
// ═══════════════════════════════════════════════════════════════

async function createWidget(data) {
  let w = new ListWidget();

  let g = new LinearGradient();
  g.locations = [0, 1];
  g.colors = [new Color("#1a1a2e"), new Color("#16213e")];
  w.backgroundGradient = g;

  // Bias header
  let header = w.addStack();
  let bias = header.addText(data.bias);
  bias.font = Font.heavySystemFont(18);
  bias.textColor = new Color(data.bias_color);
  header.addSpacer();
  let time = header.addText(data.updated);
  time.font = Font.systemFont(10);
  time.textColor = new Color("#666");

  w.addSpacer(8);

  // BTC
  let btc = w.addText("BTC " + data.btc_price);
  btc.font = Font.boldSystemFont(20);
  btc.textColor = Color.white();

  // Gold
  let gold = w.addText("XAU " + data.gold_price);
  gold.font = Font.boldSystemFont(16);
  gold.textColor = new Color("#ffd700");

  w.addSpacer(8);

  // Summary
  let sum = w.addText(data.summary);
  sum.font = Font.systemFont(11);
  sum.textColor = new Color("#ccc");
  sum.minimumScaleFactor = 0.6;

  w.addSpacer(4);

  // Fear & Greed
  let fg = w.addText("F&G: " + safe(data, "btc.sentiment.fear_greed"));
  fg.font = Font.systemFont(10);
  fg.textColor = new Color("#666");

  return w;
}

// ═══════════════════════════════════════════════════════════════
// FULL DETAIL VIEW
// ═══════════════════════════════════════════════════════════════

async function showDetailView(data) {
  let table = new UITable();
  table.showSeparators = false;

  // ─── HEADER ───
  let headerRow = new UITableRow();
  headerRow.height = 80;
  headerRow.backgroundColor = new Color("#1a1a2e");
  let biasCell = headerRow.addText(
    data.bias,
    "Market Analysis: " + (data.date || data.updated),
  );
  biasCell.titleColor = new Color(data.bias_color);
  biasCell.titleFont = Font.heavySystemFont(32);
  biasCell.subtitleColor = new Color("#666");
  biasCell.subtitleFont = Font.systemFont(13);
  table.addRow(headerRow);

  // ─── ACTIONABLE SUMMARY ───
  addSection(table, "ACTIONABLE INSIGHT");
  addTextRow(table, data.summary, "#fff", 16);

  // ─── PRICES ───
  addSection(table, "PRICES");
  addRow(table, "Bitcoin", data.btc_price, "#f7931a");
  addRow(table, "Gold", data.gold_price, "#ffd700");

  // ─── MACRO & GEOPOLITICAL ───
  addSection(table, "MACRO & GEOPOLITICAL");

  if (data.macro) {
    addTextRow(table, safe(data, "macro.geopolitics"));
    addTextRow(table, "Fed: " + safe(data, "macro.fed"));
    addTextRow(table, "Data: " + safe(data, "macro.data_releases"));
    addTextRow(table, "DXY/Yields: " + safe(data, "macro.dxy_yields"));
  }

  // ═══════════════════════════════════════════════════════════════
  // BITCOIN SECTION
  // ═══════════════════════════════════════════════════════════════

  addSection(table, "BITCOIN ANALYSIS");

  // BTC Regulatory
  if (data.btc && data.btc.regulatory) {
    addSubSection(table, "Regulatory & ETF Flows");
    addTextRow(table, "SEC: " + safe(data, "btc.regulatory.sec_news"));
    addTextRow(table, "ETF Flows: " + safe(data, "btc.regulatory.etf_flows"));
  }

  // BTC Whales
  if (data.btc && data.btc.whales) {
    addSubSection(table, "Whale Activity");
    addTextRow(table, safe(data, "btc.whales.activity"));
    if (safe(data, "btc.whales.notable") !== "No recent data") {
      addTextRow(table, "Notable: " + safe(data, "btc.whales.notable"));
    }
  }

  // BTC Technicals
  if (data.btc && data.btc.technicals) {
    addSubSection(table, "Technical Analysis");
    addTechRow(
      table,
      "Support",
      safe(data, "btc.technicals.intraday_support"),
      "#4ade80",
    );
    addTechRow(
      table,
      "Resistance",
      safe(data, "btc.technicals.intraday_resistance"),
      "#f87171",
    );
    addTechRow(
      table,
      "1M Support",
      safe(data, "btc.technicals.monthly_support"),
      "#888",
    );
    addTextRow(table, "Trend: " + safe(data, "btc.technicals.trend"));
    addTextRow(table, safe(data, "btc.technicals.chart_note"));
  }

  // BTC Sentiment
  if (data.btc && data.btc.sentiment) {
    addSubSection(table, "Sentiment");
    addRow(
      table,
      "Fear & Greed",
      safe(data, "btc.sentiment.fear_greed"),
      "#fff",
    );

    let liqUp = safe(data, "btc.sentiment.liquidations_up");
    let liqDown = safe(data, "btc.sentiment.liquidations_down");
    if (liqUp !== "No recent data") {
      addLiqRow(table, "Short Squeeze Zone", liqUp, "#4ade80");
    }
    if (liqDown !== "No recent data") {
      addLiqRow(table, "Long Liquidation Zone", liqDown, "#f87171");
    }

    addTextRow(table, safe(data, "btc.sentiment.narratives"));
  }

  // ═══════════════════════════════════════════════════════════════
  // GOLD SECTION
  // ═══════════════════════════════════════════════════════════════

  addSection(table, "GOLD ANALYSIS");

  // Gold Flows
  if (data.gold && data.gold.flows) {
    addSubSection(table, "ETF & Institutional Flows");
    addTextRow(table, "ETF Flows: " + safe(data, "gold.flows.etf_flows"));
    addTextRow(
      table,
      "Central Banks: " + safe(data, "gold.flows.central_banks"),
    );
    if (safe(data, "gold.flows.institutional") !== "No recent data") {
      addTextRow(
        table,
        "Institutional: " + safe(data, "gold.flows.institutional"),
      );
    }
  }

  // Gold Demand
  if (data.gold && data.gold.demand) {
    addSubSection(table, "Demand & Supply");
    addTextRow(table, "Physical: " + safe(data, "gold.demand.physical"));
    addTextRow(table, "Investment: " + safe(data, "gold.demand.investment"));
    if (safe(data, "gold.demand.supply") !== "No recent data") {
      addTextRow(table, "Supply: " + safe(data, "gold.demand.supply"));
    }
  }

  // Gold Technicals
  if (data.gold && data.gold.technicals) {
    addSubSection(table, "Technical Analysis");
    addTechRow(
      table,
      "Support",
      safe(data, "gold.technicals.intraday_support"),
      "#4ade80",
    );
    addTechRow(
      table,
      "Resistance",
      safe(data, "gold.technicals.intraday_resistance"),
      "#f87171",
    );
    addTechRow(
      table,
      "1M Support",
      safe(data, "gold.technicals.monthly_support"),
      "#888",
    );
    addTextRow(table, "Trend: " + safe(data, "gold.technicals.trend"));
    addTextRow(table, safe(data, "gold.technicals.chart_note"));
  }

  // Gold Sentiment
  if (data.gold && data.gold.sentiment) {
    addSubSection(table, "Sentiment");
    addTextRow(table, "Safe Haven: " + safe(data, "gold.sentiment.safe_haven"));
    addTextRow(
      table,
      "Gold/Silver Ratio: " + safe(data, "gold.sentiment.gold_silver_ratio"),
    );
    addTextRow(table, safe(data, "gold.sentiment.narratives"));
  }

  // ─── NEWS LINKS ───
  addSection(table, "NEWS LINKS");

  if (data.news_links && data.news_links.length > 0) {
    for (let news of data.news_links) {
      let row = new UITableRow();
      row.height = 60;
      row.backgroundColor = new Color("#1a1a2e");
      row.dismissOnSelect = false;
      row.onSelect = () => Safari.open(news.url);
      let cell = row.addText(news.title);
      cell.widthWeight = 100;
      cell.titleColor = new Color("#60a5fa");
      cell.titleFont = Font.systemFont(13);
      table.addRow(row);
    }
  }

  await table.present(true);
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function safe(obj, path) {
  let value = path.split(".").reduce((o, k) => (o || {})[k], obj);
  return value || "No recent data";
}

function addSection(table, title) {
  let row = new UITableRow();
  row.height = 55;
  row.backgroundColor = new Color("#0f0f1a");
  let cell = row.addText(title);
  cell.titleColor = new Color("#888");
  cell.titleFont = Font.boldSystemFont(14);
  table.addRow(row);
}

function addSubSection(table, title) {
  let row = new UITableRow();
  row.height = 40;
  row.backgroundColor = new Color("#151525");
  let cell = row.addText(title);
  cell.titleColor = new Color("#666");
  cell.titleFont = Font.semiboldSystemFont(12);
  table.addRow(row);
}

function addRow(table, label, value, color) {
  let row = new UITableRow();
  // Dynamic height: estimate lines needed + padding
  let textLen = (label + value).length;
  row.height = Math.max(80, Math.ceil(textLen / 25) * 24 + 20);
  row.backgroundColor = new Color("#1a1a2e");
  let cell = row.addText(label, value);
  cell.widthWeight = 100;
  cell.titleColor = new Color("#888");
  cell.titleFont = Font.systemFont(13);
  cell.subtitleColor = new Color(color);
  cell.subtitleFont = Font.boldSystemFont(18);
  table.addRow(row);
}

function addTechRow(table, label, value, color) {
  let row = new UITableRow();
  let textLen = (label + value).length;
  row.height = Math.max(80, Math.ceil(textLen / 25) * 24 + 20);
  row.backgroundColor = new Color("#1a1a2e");
  let cell = row.addText(label, value);
  cell.widthWeight = 100;
  cell.titleColor = new Color("#555");
  cell.titleFont = Font.systemFont(12);
  cell.subtitleColor = new Color(color);
  cell.subtitleFont = Font.boldSystemFont(16);
  table.addRow(row);
}

function addLiqRow(table, label, value, color) {
  let row = new UITableRow();
  let textLen = (label + value).length;
  row.height = Math.max(80, Math.ceil(textLen / 25) * 24 + 20);
  row.backgroundColor = new Color("#1a1a2e");
  let cell = row.addText(label, value);
  cell.widthWeight = 100;
  cell.titleColor = new Color("#666");
  cell.titleFont = Font.systemFont(12);
  cell.subtitleColor = new Color(color);
  cell.subtitleFont = Font.boldSystemFont(15);
  table.addRow(row);
}

function addTextRow(table, text, color, size) {
  color = color || "#ccc";
  size = size || 14;
  let height = Math.max(70, Math.ceil(text.length / 30) * 28);
  let row = new UITableRow();
  row.height = height;
  row.backgroundColor = new Color("#1a1a2e");
  let cell = row.addText(text);
  cell.widthWeight = 100;
  cell.titleColor = new Color(color);
  cell.titleFont = Font.systemFont(size);
  table.addRow(row);
}
