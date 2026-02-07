# 📊 Launch Budget & Expenses Tracker

An automated financial tracker built in Google Sheets that connects to the FreeAgent API. It provides real-time visibility into **Cash Runway**, **Budget Variance**, and **Departmental Spend** without manual data entry.

## 🚀 Features
* **Automated Data Pipeline:** Fetches bank transactions daily via Google Apps Script (Time-driven trigger).
* **Auto-Classification Engine:** Uses a "Keyword Fallback" protocol to categorise transactions by vendor name (e.g., "*Google" -> "Software") even if unlabelled in FreeAgent.
* **Historical Sync:** Capable of paginating through years of history across active and closed bank accounts.
* **Financial Intelligence:**
    * Calculates **Cash Runway** based on a rolling 3-month average burn.
    * Tracks **Budget vs. Actuals** with traffic-light variance indicators.

## 🛠️ Architecture
* **Backend:** Google Apps Script (JavaScript).
* **API:** FreeAgent v2 API (OAuth2).
* **Data Storage:** Google Sheets (`Raw_Data` tab).
* **Security:** OAuth2 credentials stored via `PropertiesService` (never hardcoded).

## ⚙️ Setup Guide

### 1. FreeAgent API
1.  Create a Developer App at [FreeAgent Dev Dashboard](https://dev.freeagent.com).
2.  Set Redirect URI to: `https://script.google.com/macros/d/{YOUR_SCRIPT_ID}/usercallback`.

### 2. Google Sheets
1.  Open the Sheet and go to **Extensions > Apps Script**.
2.  Paste the code from `src/FA_Sync_Engine.js` and `src/Auth.js`.
3.  Add the **OAuth2** Library (ID: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`).

### 3. Credentials ("John Doe" Protocol)
To protect sensitive financial and business data, do not paste keys into the code. Go to **Project Settings > Script Properties** and add:
* `CLIENT_ID`: Your FreeAgent App ID.
* `CLIENT_SECRET`: Your FreeAgent Secret.

### 4. Deployment
Run the `installTrigger()` function to set the 06:00 Daily Sync (or run whatever trigger you wish e.g. upon spreadsheet open)

## 📄 License
MIT License. Free to use for your own business or personal financial tracking.
