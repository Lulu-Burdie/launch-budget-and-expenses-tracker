// 1. Configuration & Security
const SCRIPT_PROPS = PropertiesService.getScriptProperties();
const BASE_URL = 'https://api.freeagent.com/v2';

// 2. Main Execution Function
function runDailySync() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const rawDataTab = sheet.getSheetByName('Raw_Data');
  const mappingTab = sheet.getSheetByName('Mapping');
  
  // 1. Fetch Transactions (Unrestricted)
  const transactions = getFreeAgentData(); 
  
  if (transactions.length === 0) {
    console.log("Sync Complete: No new transactions found.");
    return;
  }

  // 2. Get Rules
  const rules = getMappingRules(mappingTab);
  const existingIds = getExistingIds(rawDataTab); 
  
  const newRows = [];
  
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

  // 3. Append data
  if (newRows.length > 0) {
    const startRow = rawDataTab.getLastRow() + 1;
    rawDataTab.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
    console.log(`SUCCESS: Added ${newRows.length} transactions.`);
  } else {
    console.log("Sync Complete: All downloaded transactions were duplicates.");
  }
}

// Helper: Parse Mapping Rules
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

// 3. API Connection (Pagination + Hidden Accounts)
function getFreeAgentData() {
  const service = getService_();
  if (!service.hasAccess()) return [];

  const today = new Date();
  const lookbackDate = new Date(today);
  lookbackDate.setDate(today.getDate() - 730); // 2 Years Lookback (for closed accounts)
  const dateString = Utilities.formatDate(lookbackDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  const allTransactions = [];
  const authHeader = { Authorization: 'Bearer ' + service.getAccessToken() };

  try {
    // A. Get ALL Accounts (Added view=all to see Closed/Inactive)
    const accResponse = UrlFetchApp.fetch(`${BASE_URL}/bank_accounts?view=all`, { headers: authHeader, muteHttpExceptions: true });
    const accounts = JSON.parse(accResponse.getContentText()).bank_accounts || [];

    console.log(`Found ${accounts.length} bank accounts (including closed).`);

    // B. Loop Accounts
    accounts.forEach(account => {
      let page = 1;
      let keepFetching = true;
      
      console.log(`Fetching: ${account.name}...`);

      // C. Pagination Loop (Keep asking until data runs dry)
      while (keepFetching) {
        const txUrl = `${BASE_URL}/bank_transactions?bank_account=${encodeURIComponent(account.url)}&from_date=${dateString}&page=${page}&per_page=100`;
        
        const txResponse = UrlFetchApp.fetch(txUrl, { headers: authHeader, muteHttpExceptions: true });
        const rawTxs = JSON.parse(txResponse.getContentText()).bank_transactions || [];
        
        if (rawTxs.length === 0) {
          keepFetching = false; // Stop if page is empty
        } else {
          rawTxs.forEach(tx => {
            tx.id = tx.url.split('/').pop();
            allTransactions.push(tx);
          });
          
          if (rawTxs.length < 100) {
             keepFetching = false; // Stop if page wasn't full (last page)
          } else {
             page++; // Next page
          }
        }
      }
    });

  } catch (e) {
    console.error(e);
  }
  return allTransactions;
}
