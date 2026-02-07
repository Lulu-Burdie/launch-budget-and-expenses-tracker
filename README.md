# 📊 Company Finance Dashboard

An automated financial command centre for Google Sheets that connects to the FreeAgent API. Designed for **Pre-Revenue** and **Launch-Stage** companies, it provides real-time visibility into **Cash Runway**, **Launch Budget vs. Actuals**, and **Funding Shortfalls** without manual data entry.

## 🚀 Features
* **Live Cash Position:** Fetches real-time balances from all active bank accounts instantly.
* **Launch Gap Analysis:** Automatically calculates total funding raised vs. total launch budget to highlight funding shortfalls.
* **Auto-Classification Engine:** Uses a "Keyword Fallback" protocol to categorise transactions by vendor name (e.g., `*Google` -> `Software`) even if unlabelled in FreeAgent.
* **Deep Historical Sync:** Paginates through 2 years of history across active and closed bank accounts.
* **Financial Intelligence:**
    * Calculates **Cash Runway (Days)** based on a rolling 3-month average burn.
    * Tracks **Departmental Spend** with traffic-light variance indicators.

## ⚙️ Installation Guide

### Step 1: The Spreadsheet
1.  Download the `company finance dashboard template.xlsx` file from this repository.
2.  Upload it to your **Google Drive**.
3.  **Open it as a Google Sheet** (File > Save as Google Sheets).
4.  *Optional:* Rename the file to **Company Finance**.

### Step 2: The FreeAgent API
1.  Log in to the [FreeAgent Developer Dashboard](https://dev.freeagent.com).
2.  Click **Create New App**.
3.  **Name:** `Finance Dashboard`.
4.  **Redirect URI:** Leave blank for now (we will get this in Step 3).
5.  Keep this tab open. You will need the **OAuth Identifier (Client ID)** and **Secret** shortly.

### Step 3: The Code
1.  In your Google Sheet, go to **Extensions > Apps Script**.
2.  **Paste the Code:**
    * Copy `src/FA_Sync_Engine.js` -> Paste into `Code.gs` (rename the file to `FA_Sync_Engine`).
    * Create a new script file named `Auth` -> Paste `src/Auth.js`.
3.  **Add the OAuth2 Library:**
    * Click **Libraries (+)** on the left sidebar.
    * Paste this Script ID: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`
    * Click **Look up** > **Add**.

### Step 4: The Connection (Important)
1.  In the Apps Script editor, copy the **Script ID** from the URL (it is the long string between `/d/` and `/edit`).
2.  Go back to your **FreeAgent Developer Dashboard**.
3.  **Update the Redirect URI** to:
    `https://script.google.com/macros/d/{YOUR_SCRIPT_ID}/usercallback`
    *(Replace `{YOUR_SCRIPT_ID}` with the ID you just copied)*.
4.  Save the App.

### Step 5: Security Credentials
*To protect sensitive data, do not paste keys directly into the code.*
1.  In Apps Script, go to **Project Settings** (Gear Icon ⚙️).
2.  Scroll to **Script Properties**.
3.  Click **Add script property** and add these two rows:
    * Property: `CLIENT_ID`  |  Value: *[Paste OAuth Identifier from FreeAgent]*
    * Property: `CLIENT_SECRET`  |  Value: *[Paste Secret from FreeAgent]*
4.  Click **Save**.

## 🖥️ How to Run
1.  Refresh your Google Sheet.
2.  Wait 5 seconds. A new menu **"Financial Intelligence"** will appear in the toolbar.
3.  Click **Financial Intelligence > 🔄 Run Sync Now**.
4.  **First Run Authorisation:**
    * Google will ask for permission. Click **Review Permissions > Choose Account > Advanced > Go to (Unsafe) > Allow**.
    * *Note: It says "Unsafe" because you are the developer. This is normal.*
5.  A sidebar will appear asking you to **Log in to FreeAgent**.
6.  Once approved, the data will flow immediately.

## 📄 License
MIT License. Free to use for your own business or personal financial tracking.
