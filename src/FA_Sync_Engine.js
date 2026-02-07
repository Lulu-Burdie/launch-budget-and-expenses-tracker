// 1. Configuration & Security
const SCRIPT_PROPS = PropertiesService.getScriptProperties();
const BASE_URL = 'https://api.freeagent.com/v2';

/**
 * TRIGGER: Runs automatically when the Spreadsheet is opened.
 * Adds a menu to the toolbar for easy access.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Financial Intelligence')
      .addItem('🔄 Run Sync Now', 'runSync')
      .addSeparator()
      .addItem('💰 Update Cash Balance Only', 'updateCashBalance')
      .addToUi();
}

// 2. Main Execution Function
function runSync() {
  console.log("🚀 STARTING SYNC: Initializing Financial Intelligence Engine...");
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const rawDataTab = sheet.getSheetByName('Raw_Data');
  const mappingTab = sheet.getSheetByName('Mapping');
  
  // A. Fetch Transactions
  const transactions = getFreeAgentData(); 
  
  if (transactions.length > 0) {
    console.log(`⚡ Processing ${transactions.length} new transactions against Mapping Rules...`);
    
    // Get Rules
    const rules = getMappingRules(mappingTab);
    const existingIds = getExistingIds(rawDataTab); 
    
    const newRows = [];
    let autoClassifiedCount = 0;
    
    transactions.forEach(tx => {
      if (!existingIds.has(tx.id)) {
        
        let categoryName = "Uncategorised";
        let department = "General Administrative"; 
        
        const desc = (tx.description || "").toLowerCase();

        // Priority 1: Keyword Match (Auto-Classify)
        let foundMatch = false;
        for (const rule of rules.keywords) {
          if (desc.includes(rule.keyword)) {
            categoryName = rule.category; 
            department = rule.department; 
            foundMatch = true;
            autoClassifiedCount++;
            break;
          }
        }

        // Priority 2: FreeAgent Category (if API provided one)
        if (!foundMatch && tx.category_name && rules.exact[tx.category_name]) {
          categoryName = tx.category_name;
          department = rules.exact[tx.category_name];
        }
        
        newRows.push([
          tx.dated_on,
          tx.description,
          tx.amount,
          categoryName,
          department,
          tx.id 
        ]); 
      }
    });

    // Append data
    if (newRows.length > 0) {
      const startRow = rawDataTab.getLastRow() + 1;
      rawDataTab.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
      console.log(`✅ SUCCESS: Added ${newRows.length} new rows to Raw_Data.`);
      console.log(`🤖 Auto-Classified: ${autoClassifiedCount} transactions.`);
    } else {
      console.log("ℹ️ Sync Complete: Transactions downloaded, but they were all duplicates.");
    }
  } else {
    console.log("ℹ️ Sync Complete: No new transactions found from FreeAgent.");
  }

  // B. UPDATE CASH BALANCE
  updateCashBalance();
  
  console.log("🏁 MISSION COMPLETE: Dashboard is up to date.");
}

// ---------------- HELPERS ---------------- //

function getMappingRules(sheet) {
  const data = sheet.getDataRange().getValues();
  const exact = {};
  const keywords = [];
  
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const dept = data[i][1];
    
    if (key.startsWith("*")) {
      keywords.push({
        keyword: key.replace(/\*/g, '').toLowerCase(),
        category: "Auto: " + key.replace(/\*/g, ''), 
        department: dept
      });
    } else {
      exact[key] = dept;
    }
  }
  return { exact, keywords };
}

function getExistingIds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  const data = sheet.getRange(2, 6, lastRow - 1, 1).getValues(); 
  const ids = new Set();
  data.forEach(row => { if (row[0]) ids.add(String(row[0])); });
  return ids;
}

// 3. API Connection (With Detailed Logging)
function getFreeAgentData() {
  const service = getService_();
  if (!service.hasAccess()) {
    console.error("❌ AUTH ERROR: Please run the Auth script again.");
    return [];
  }

  const today = new Date();
  const lookbackDate = new Date(today);
  lookbackDate.setDate(today.getDate() - 730); // 2 Years Lookback
  const dateString = Utilities.formatDate(lookbackDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  const allTransactions = [];
  const authHeader = { Authorization: 'Bearer ' + service.getAccessToken() };

  try {
    console.log("🔍 API: Searching for bank accounts...");
    const accResponse = UrlFetchApp.fetch(`${BASE_URL}/bank_accounts?view=all`, { headers: authHeader, muteHttpExceptions: true });
    const accounts = JSON.parse(accResponse.getContentText()).bank_accounts || [];

    console.log(`🏦 Found ${accounts.length} accounts (Active & Closed).`);

    accounts.forEach(account => {
      let page = 1;
      let keepFetching = true;
      let accountTxCount = 0;
      
      console.log(`   👉 Checking: ${account.name}...`);
      
      while (keepFetching) {
        const txUrl = `${BASE_URL}/bank_transactions?bank_account=${encodeURIComponent(account.url)}&from_date=${dateString}&page=${page}&per_page=100`;
        const txResponse = UrlFetchApp.fetch(txUrl, { headers: authHeader, muteHttpExceptions: true });
        const rawTxs = JSON.parse(txResponse.getContentText()).bank_transactions || [];
        
        if (rawTxs.length === 0) {
          keepFetching = false; 
        } else {
          rawTxs.forEach(tx => {
            tx.id = tx.url.split('/').pop();
            allTransactions.push(tx);
          });
          
          accountTxCount += rawTxs.length;

          if (rawTxs.length < 100) {
             keepFetching = false;
          } else {
             console.log(`      - Page ${page} complete. fetching next...`);
             page++;
          }
        }
      }
      console.log(`      ✓ Retrieved ${accountTxCount} transactions.`);
    });

  } catch (e) {
    console.error("❌ CRITICAL API ERROR: " + e.toString());
  }
  return allTransactions;
}

// 4. Live Cash Balance (Target: Dashboard B5)
function updateCashBalance() {
  console.log("💰 BALANCE CHECK: Fetching live cash position...");
  
  const service = getService_();
  if (!service.hasAccess()) return;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const dashboardTab = sheet.getSheetByName('Dashboard');
  
  const authHeader = { Authorization: 'Bearer ' + service.getAccessToken() };
  const url = `${BASE_URL}/bank_accounts?view=active`; 
  
  try {
    const response = UrlFetchApp.fetch(url, { headers: authHeader, muteHttpExceptions: true });
    const accounts = JSON.parse(response.getContentText()).bank_accounts || [];
    
    let totalCash = 0;
    
    accounts.forEach(acc => {
      if (acc.current_balance) {
        totalCash += parseFloat(acc.current_balance);
      }
    });
    
    // Write to Cell B5
    dashboardTab.getRange("B5").setValue(totalCash);
    console.log(`💷 LIVE CASH UPDATED: £${totalCash.toLocaleString()}`);
    
  } catch (e) {
    console.error("❌ BALANCE ERROR: " + e.toString());
  }
}
