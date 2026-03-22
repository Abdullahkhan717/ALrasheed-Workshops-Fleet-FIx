/**
 * Google Apps Script for Workshop Management System
 * 
 * This script handles CRUD operations for the application.
 * Deploy this as a Web App with 'Anyone' access.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getAllData') {
    return getAllData();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action.toUpperCase();
    const sheetName = request.sheetName;
    const data = request.data;
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Initialize headers if sheet is new
      const headers = Object.keys(data);
      sheet.appendRow(headers);
    }
    
    if (action === 'CREATE') {
      return createRecord(sheet, data);
    } else if (action === 'UPDATE') {
      return updateRecord(sheet, data);
    } else if (action === 'DELETE') {
      return deleteRecord(sheet, data.id);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  const data = {};
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    const values = sheet.getDataRange().getValues();
    if (values.length > 1) {
      const headers = values[0];
      const rows = values.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      data[name] = rows;
    } else {
      data[name] = [];
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createRecord(sheet, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => data[header] || '');
  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateRecord(sheet, data) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  
  if (idIndex === -1) throw new Error('No id column found');
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(data.id)) {
      const row = headers.map(header => data[header] !== undefined ? data[header] : values[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  throw new Error('Record not found');
}

function deleteRecord(sheet, id) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  
  if (idIndex === -1) throw new Error('No id column found');
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  throw new Error('Record not found');
}

/**
 * NEW HEADERS FOR TyreLogs:
 * id, Vehicle ID, Date, Time, Mileage, Driver Name, Workshop Location, brand, Tyre Type, Tyre Size, Serial Number, From Vehicle, remarks
 */
