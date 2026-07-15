/**
 * ANVESHA - Inter PU Sports & Cultural Fest Management System
 * Christ University - Google Apps Script Backend (Google Sheets as Database)
 * 
 * Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script.
 * 2. Paste this code into Code.gs.
 * 3. Deploy as Web App -> Execute as 'Me' -> Access: 'Anyone'.
 * 4. Copy Web App URL to server .env as GOOGLE_APPS_SCRIPT_URL.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet() ? SpreadsheetApp.getActiveSpreadsheet().getId() : '';

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ACTIVE',
    service: 'ANVESHA Google Sheets Database API',
    university: 'Christ University',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload || {};

    let result = { success: true };

    switch (action) {
      case 'INIT_SHEETS':
        result.data = initAllSheets();
        break;
      case 'SAVE_INSTITUTION':
        result.data = appendRow('Institutions', payload);
        break;
      case 'SAVE_TEAM':
        result.data = appendRow('Teams', payload);
        break;
      case 'SAVE_TEAMS':
        result.data = appendRows('Teams', payload);
        break;
      case 'SAVE_PARTICIPANTS':
        result.data = appendRows('Participants', payload);
        break;
      case 'GET_ALL':
        result.data = getAllSheetData(payload.sheetName);
        break;
      case 'SAVE_BANK_PAYMENT':
        result.data = appendRow('BankPayments', payload);
        break;
      case 'UPDATE_BANK_PAYMENT':
        result.data = updateRowById('BankPayments', payload.id, payload);
        break;
      case 'SEND_EMAIL':
        result.data = sendOutboundEmail(payload);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/** Sheet Setup Helper */
function initAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredSheets = ['BankPayments', 'Participants', 'Teams', 'Institutions', 'Events'];

  // 1. Create/Ensure required sheets exist
  let createdCount = 0;
  requiredSheets.forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      createdCount++;
    }
  });

  // 2. Remove all sheets that are NOT in the required list
  const allSheets = ss.getSheets();
  let deletedCount = 0;
  allSheets.forEach(function(sheet) {
    const sheetName = sheet.getName();
    if (requiredSheets.indexOf(sheetName) === -1) {
      if (ss.getSheets().length > 1) {
        ss.deleteSheet(sheet);
        deletedCount++;
      }
    }
  });

  populateEvents();
  populateBankPayments();

  const message = 'Initialized sheets successfully. Required sheets: ' + requiredSheets.join(', ') + '. Created: ' + createdCount + ', Deleted: ' + deletedCount + ' obsolete sheets.';
  Logger.log(message);
  return message;
}

function populateEvents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Events') || ss.insertSheet('Events');
  if (sheet.getLastRow() > 0) return; // already populated

  const headers = [
    'id', 'name', 'category', 'type', 'minTeamSize', 'maxTeamSize', 
    'registrationFee', 'description', 'rules', 'eligibility'
  ];
  sheet.appendRow(headers);

  const defaultEvents = [
    ['sports_football_boys', 'Football (Boys)', 'SPORTS', 'TEAM', 11, 16, 500, 'Inter PU 11-a-side Football Championship. Knockout tournament adhering to FIFA guidelines.', '["Maximum 2 teams per institution (Team A and Team B).","Match duration: 25 mins half with 5 mins break.","Team must carry proper sports kit and football studs.","Referees decisions are final and binding."]', 'Open to registered 1st & 2nd Year PU Students only.'],
    ['sports_volleyball_boys', 'Volleyball (Boys)', 'SPORTS', 'TEAM', 6, 12, 500, 'Fast-paced high-energy Volleyball Tournament under standard VFI rules.', '["Maximum 2 teams per institution.","Best of 3 sets (25 points per set).","Proper team jersey with numbers mandatory."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['sports_volleyball_girls', 'Volleyball (Girls)', 'SPORTS', 'TEAM', 6, 12, 500, 'Fast-paced high-energy Volleyball Tournament under standard VFI rules.', '["Maximum 2 teams per institution.","Best of 3 sets (25 points per set).","Proper team jersey with numbers mandatory."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['sports_tug_of_war_boys', 'Tug of War (Boys)', 'SPORTS', 'TEAM', 8, 10, 500, 'Test of pure strength, coordination, and team endurance.', '["Maximum 2 teams per institution.","Weight limit per team: 650kg cumulative maximum.","Best of 3 pulls per round."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['sports_tug_of_war_girls', 'Tug of War (Girls)', 'SPORTS', 'TEAM', 8, 10, 500, 'Test of pure strength, coordination, and team endurance.', '["Maximum 2 teams per institution.","Weight limit per team: 650kg cumulative maximum.","Best of 3 pulls per round."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['cultural_dance', 'Group Dance', 'CULTURALS', 'TEAM', 6, 15, 500, 'Vibrant stage dance showcase incorporating choreography, synchronization, and creative concepts.', '["Maximum 2 teams per institution.","Time limit: 8 minutes + 2 minutes setup time.","Props allowed (no fire, liquids, or sharp items)."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['cultural_music', 'Group Music', 'CULTURALS', 'TEAM', 4, 10, 500, 'Live musical ensemble featuring vocals, instruments, and harmonic arrangements.', '["Maximum 2 teams per institution.","Time limit: 10 minutes including setup.","No pre-recorded backing tracks permitted."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['cultural_debate', 'Debate', 'CULTURALS', 'INDIVIDUAL', 1, 1, 200, 'Intellectual arena for sharp arguments, rebuttals, and eloquent speaking.', '["Maximum 2 participants per institution.","Topic provided 1 hour before the session.","3 mins constructive speech + 1 min rebuttal."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['cultural_open_mic', 'Open Mic', 'FUN_ACTIVITIES', 'INDIVIDUAL', 1, 1, 0, 'Solo performance stage for creative expression in spoken word or comedy.', '["Maximum 2 participants per institution.","Performance time: 5 minutes max.","Content must be respectful and strictly non-offensive."]', 'Open to registered 1st & 2nd Year PU Students.'],
    ['cultural_treasure_hunt', 'Treasure Hunt', 'FUN_ACTIVITIES', 'TEAM', 4, 4, 0, 'Campus-wide thrill race solving riddles, puzzles, and physical clues across Christ University campus.', '["Maximum 2 teams per institution.","Mobile phones restricted during active clue rounds.","All 4 members must cross the finish line together."]', 'Open to registered 1st & 2nd Year PU Students.']
  ];

  defaultEvents.forEach(function(row) {
    sheet.appendRow(row);
  });
}

function appendRow(sheetName, record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  if (sheet.getLastRow() === 0) {
    const keys = Object.keys(record);
    sheet.appendRow(keys);
    const values = keys.map(function(k) { return record[k]; });
    sheet.appendRow(values);
    return record;
  }
  
  // Get existing headers
  let headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  headers = headers.map(function(h) { return String(h).trim(); });
  
  // Auto-expand headers in row 1 if record contains new fields
  const recordKeys = Object.keys(record);
  let headersChanged = false;
  
  recordKeys.forEach(function(key) {
    if (key && headers.indexOf(key) === -1) {
      headers.push(key);
      headersChanged = true;
    }
  });
  
  if (headersChanged) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // Map values to aligned headers
  const rowValues = headers.map(function(header) {
    return record[header] !== undefined ? record[header] : '';
  });
  
  sheet.appendRow(rowValues);
  return record;
}

function appendRows(sheetName, records) {
  if (!Array.isArray(records)) return [];
  records.forEach(function(r) { appendRow(sheetName, r); });
  return records;
}

function updateRowById(sheetName, id, updatedRecord) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  let headers = data[0].map(function(h) { return String(h).trim(); });
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) return null;

  // Auto-expand headers in row 1 if updatedRecord contains new fields
  const recordKeys = Object.keys(updatedRecord);
  let headersChanged = false;
  recordKeys.forEach(function(key) {
    if (key && headers.indexOf(key) === -1) {
      headers.push(key);
      headersChanged = true;
    }
  });

  if (headersChanged) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] == id) {
      const keys = Object.keys(updatedRecord);
      keys.forEach(function(key) {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updatedRecord[key]);
        }
      });
      return updatedRecord;
    }
  }
  return null;
}

function getAllSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach(function(header, idx) {
      obj[header] = row[idx];
    });
    results.push(obj);
  }
  return results;
}

function populateBankPayments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('BankPayments') || ss.insertSheet('BankPayments');
  if (sheet.getLastRow() > 0) return; // already populated

  const headers = [
    'id', 'transactionId', 'institutionName', 'email', 'phone', 'amount', 
    'date', 'status', 'registrationId', 'invitationSent', 'invitationSentAt',
    'principalName', 'eventName', 'address'
  ];
  sheet.appendRow(headers);

  const initialBankPayments = [
    ['BP-SIB-9921', 'TXN-SIB-883901', 'Bishop Cotton Boys\' School', 'principal@bcbs.edu.in', '080-22211429', 5000, '2026-07-06T10:00:00Z', 'PENDING', '', false, ''],
    ['BP-SIB-9922', 'TXN-SIB-992817', 'CMR National PU College', 'info@cmrpuc.edu.in', '080-25443210', 3500, '2026-07-06T11:30:00Z', 'PENDING', '', false, ''],
    ['BP-SIB-9923', 'TXN-SIB-102938', 'Christ Junior College', 'office@cjc.christuniversity.in', '080-40129200', 6000, '2026-07-07T09:15:00Z', 'USED', 'ANV-2026-1003', true, '2026-07-07T09:20:00Z']
  ];

  initialBankPayments.forEach(function(row) {
    sheet.appendRow(row);
  });
}

/** Outbound Email Dispatcher */
function sendOutboundEmail(payload) {
  if (!payload.to || !payload.subject || !payload.htmlBody) {
    throw new Error('Email recipient, subject, and htmlBody are required.');
  }

  MailApp.sendEmail({
    to: payload.to,
    subject: payload.subject,
    htmlBody: payload.htmlBody,
    noReply: true
  });

  return 'Email successfully sent via Google Apps Script MailApp service.';
}
