// CryptoTick Widget - by Daniel Wooster
// Full Market Analysis Report

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
  let btc = w.addText("₿ " + data.btc_price);
  btc.font = Font.boldSystemFont(20);
  btc.textColor = Color.white();

  // ETH
  let eth = w.addText("Ξ " + data.eth_price);
  eth.font = Font.boldSystemFont(16);
  eth.textColor = new Color("#aaa");

  w.addSpacer(8);

  // Summary
  let sum = w.addText(data.summary);
  sum.font = Font.systemFont(11);
  sum.textColor = new Color("#ccc");
  sum.minimumScaleFactor = 0.6;

  w.addSpacer(4);

  // Fear & Greed
  let fg = w.addText("F&G: " + safe(data, "sentiment.fear_greed"));
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
    "Market Analysis: " + (data.date || data.updated)
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
  addRow(table, "Ethereum", data.eth_price, "#627eea");

  // ─── SECTION 1: MACRO & GEOPOLITICAL ───
  addSection(table, "MACRO & GEOPOLITICAL LANDSCAPE");

  if (data.macro) {
    addSubSection(table, "Geopolitics");
    addTextRow(table, safe(data, "macro.geopolitics"));

    if (data.macro.trade) {
      addSubSection(table, "Trade");
      addTextRow(table, safe(data, "macro.trade"));
    }

    addSubSection(table, "Central Bank & Economy");
    addTextRow(table, "Fed: " + safe(data, "macro.fed"));
    addTextRow(table, "Data Releases: " + safe(data, "macro.data_releases"));
    addTextRow(table, "DXY/Yields: " + safe(data, "macro.dxy_yields"));
  }

  // ─── REGULATORY ───
  addSection(table, "REGULATORY & LEGAL");

  if (data.regulatory) {
    addTextRow(table, "SEC: " + safe(data, "regulatory.sec_news"));
    addTextRow(table, "ETF Flows: " + safe(data, "regulatory.etf_flows"));
    if (data.regulatory.other) {
      addTextRow(table, "Other: " + safe(data, "regulatory.other"));
    }
  }

  // ─── WHALES ───
  addSection(table, "WHALE ACTIVITY");

  if (data.whales) {
    addTextRow(table, safe(data, "whales.activity"));
    if (data.whales.positioning) {
      addTextRow(table, "Positioning: " + safe(data, "whales.positioning"));
    }
    if (data.whales.notable) {
      addTextRow(table, "Notable: " + safe(data, "whales.notable"));
    }
  } else if (data.regulatory && data.regulatory.whale_activity) {
    addTextRow(table, safe(data, "regulatory.whale_activity"));
  }

  // ─── SECTION 2: TECHNICAL ANALYSIS ───
  addSection(table, "TECHNICAL ANALYSIS");

  if (data.technicals) {
    // BTC Table
    addSubSection(table, "Bitcoin");
    addTechRow(
      table,
      "Support",
      safe(data, "technicals.btc_intraday_support"),
      "#4ade80"
    );
    addTechRow(
      table,
      "Resistance",
      safe(data, "technicals.btc_intraday_resistance"),
      "#f87171"
    );
    addTechRow(
      table,
      "1M Support",
      safe(data, "technicals.btc_1m_support"),
      "#888"
    );
    if (data.technicals.btc_trend) {
      addTextRow(table, "Trend: " + safe(data, "technicals.btc_trend"));
    }
    addTextRow(table, safe(data, "technicals.btc_chart_note"));

    // ETH Table
    addSubSection(table, "Ethereum");
    addTechRow(
      table,
      "Support",
      safe(data, "technicals.eth_intraday_support"),
      "#4ade80"
    );
    addTechRow(
      table,
      "Resistance",
      safe(data, "technicals.eth_intraday_resistance"),
      "#f87171"
    );
    addTechRow(
      table,
      "1M Support",
      safe(data, "technicals.eth_1m_support"),
      "#888"
    );
    if (data.technicals.eth_trend) {
      addTextRow(table, "Trend: " + safe(data, "technicals.eth_trend"));
    }
    addTextRow(table, safe(data, "technicals.eth_chart_note"));
  }

  // ─── SECTION 3: SENTIMENT ───
  addSection(table, "SENTIMENT & CATALYSTS");

  if (data.sentiment) {
    let fgValue = safe(data, "sentiment.fear_greed");
    if (fgValue && fgValue !== "No recent data") {
      addRow(table, "Fear & Greed Index", fgValue, "#fff");
    }

    if (data.sentiment.fear_greed_note) {
      addTextRow(table, safe(data, "sentiment.fear_greed_note"));
    }

    let liqUp = safe(data, "sentiment.liquidations_up");
    let liqDown = safe(data, "sentiment.liquidations_down");

    if (
      (liqUp && liqUp !== "No recent data") ||
      (liqDown && liqDown !== "No recent data")
    ) {
      addSubSection(table, "Liquidation Heatmap");
      if (liqUp && liqUp !== "No recent data") {
        addLiqRow(table, "Short Squeeze Zone", liqUp, "#4ade80");
      }
      if (liqDown && liqDown !== "No recent data") {
        addLiqRow(table, "Long Liquidation Zone", liqDown, "#f87171");
      }
    }

    let narratives = safe(data, "sentiment.narratives");
    if (narratives && narratives !== "No recent data") {
      addSubSection(table, "Narratives");
      addTextRow(table, narratives);
    }
  }

  // ─── SECTION 4: NEWS LINKS ───
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
  row.height = 55;
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
  row.height = 55;
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
  row.height = 60;
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
  let height = Math.max(55, Math.ceil(text.length / 35) * 22);
  let row = new UITableRow();
  row.height = height;
  row.backgroundColor = new Color("#1a1a2e");
  let cell = row.addText(text);
  cell.widthWeight = 100;
  cell.titleColor = new Color(color);
  cell.titleFont = Font.systemFont(size);
  table.addRow(row);
}
