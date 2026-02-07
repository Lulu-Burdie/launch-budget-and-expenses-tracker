# 📊 Company Finance Dashboard

An automated financial command centre for Google Sheets that connects to the FreeAgent API. Designed for **Pre-Revenue** and **Launch-Stage** companies, it provides real-time visibility into **Cash Runway**, **Launch Budget vs. Actuals**, and **Funding Shortfalls** without manual data entry.

## 🚀 Features
* **Live Cash Position:** Fetches real-time balances from all active bank accounts instantly.
* **Launch Gap Analysis:** Automatically calculates total funding raised vs. total launch budget to highlight funding shortfalls.
* **Auto-Classification Engine:** Uses a "Keyword Fallback" protocol to categorise transactions by vendor name (e.g., "*Google" -> "Software") even if unlabelled in FreeAgent.
* **Deep Historical Sync:** Paginates through 2 years of history across active and closed bank accounts.
* **Financial Intelligence:**
    * Calculates **Cash Runway (Days)** based on a rolling 3-month average burn.
    * Tracks **Departmental Spend** with traffic-light variance indicators.

## 🛠️ Architecture
* **Backend:** Google Apps Script (JavaScript).
* **API:** FreeAgent v2 API (OAuth2).
* **Database:** Google Sheets (`Raw_Data` tab).
* **Security:** OAuth2 credentials stored via `PropertiesService` (keys are never hardcoded).

## ⚙️ Setup Guide

### 1. FreeAgent API
1.  Create a Developer App at [FreeAgent Dev Dashboard](https://dev.freeagent.com).
2.  Set Redirect URI to: `https://script.google.com/macros/d/{YOUR_SCRIPT_ID}/usercallback`.

### 2. Google Sheets
1.  Open the Sheet and go to **Extensions > Apps Script**.
2.  Paste the code from `src/FA_Sync_Engine.js` and `src/Auth.js`.
3.  Add the **OAuth2** Library (ID: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`).

### 3. Credentials ("John Doe" Protocol)
To protect sensitive financial data, **do not** paste keys into the code. Go to **Project Settings > Script Properties** and add:
* `CLIENT_ID`: Your FreeAgent App ID.
* `CLIENT_SECRET`: Your FreeAgent Secret.

### 4. Usage
* **Refresh Data:** A custom menu **"Financial Intelligence"** will appear in the toolbar. Click **Run Sync Now** to fetch the latest transactions and bank balances.
* **Mapping:** Add keywords to the `Mapping` tab (start with `*`) to auto-assign vendors to specific departments.

## 📄 License
MIT License. Free to use for your own business or personal financial tracking.
