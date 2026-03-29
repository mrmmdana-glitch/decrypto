# Decrypto — Bitcoin AML Intelligence Platform

A production-ready AML (Anti-Money Laundering) platform for Bitcoin wallet risk analysis, transaction graph visualisation, and network-level threat surveillance.

---

## Architecture

```
decrypto/
├── frontend/                      React 19 + Vite 8 frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── wallet/            WalletDashboard, WalletGraph, Cockpit
│   │   │   └── network/           NetworkScanDashboard, NetworkScanGraph, ...
│   │   ├── hooks/                 useWalletAnalysis, useNetworkScan
│   │   ├── adapters/              walletAdapter, networkAdapter
│   │   └── services/api.js        Centralised fetch layer
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/                       FastAPI + Python API
    ├── main.py
    ├── src/
    │   ├── api.py                 REST endpoints
    │   ├── predict_wallet.py      ML risk scoring
    │   ├── graph_builder.py       Transaction graph (mempool.space)
    │   ├── feature_builder.py     On-chain feature extraction
    │   ├── llm_summarizer.py      Gemini AI narrative summary
    │   └── transaction_scorer.py
    ├── data/                      ⚠ gitignored — see "Dataset" section below
    ├── models/                    ⚠ .joblib files gitignored — JSON/CSV kept
    ├── requirements.txt
    └── .env.example
```

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A [Google Gemini API key](https://makersuite.google.com/app/apikey) *(optional — AI summaries disabled without it)*

---

## Quick Start

### 1 — Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set:
#   GEMINI_API_KEY=your_key_here

# Start the API server
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Visit `/docs` for the Swagger UI.

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies all `/api` calls to `http://localhost:8000` automatically.

---

## Network Scan (Elliptic Dataset)

The Network Surveillance dashboard requires the Elliptic Bitcoin dataset. Place the following files in `backend/data/`:

```
backend/data/wallets_features.csv
backend/data/wallets_classes.csv
backend/data/AddrAddr_edgelist.csv
```

Without these files the network scan endpoint returns a graceful `data_source: "unavailable"` response and the UI shows an informational message rather than crashing.

> Dataset available from [Kaggle — Elliptic Data Set](https://www.kaggle.com/datasets/ellipticco/elliptic-data-set). Files are gitignored.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/wallet/{address}` | ML risk score + on-chain stats for a BTC address |
| `POST` | `/api/wallet` | Same as above via request body |
| `GET` | `/api/graph/{address}` | Transaction graph (nodes + edges) |
| `GET` | `/api/transaction/{txid}` | Single transaction risk score |
| `GET` | `/api/network/summary` | Network-wide threat summary (requires dataset) |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini key for AI wallet summaries |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 3.4, react-force-graph-2d, Recharts, Framer Motion |
| Backend | FastAPI, Uvicorn, pandas, scikit-learn, joblib, requests, python-dotenv |
| Data sources | mempool.space Bitcoin API, Elliptic dataset, Google Gemini AI |
| Chain | Bitcoin (mainnet) |

