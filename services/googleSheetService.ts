import type { Vehicle, Workshop, RepairRequest, User } from '../types';

const SCRIPT_URL = (import.meta.env.VITE_SHEETDB_URL || 'https://script.google.com/macros/s/AKfycbz4AnJ6u6GLnUX_bGHlfSyNukOX-8xDMtI6D8D3MF-DgkfuiYTleWZ-tau_2c0Y4DZG/exec').trim();

export const getAllData = async () => {
  try {
    if (!SCRIPT_URL || SCRIPT_URL === 'undefined') {
      throw new Error('Google Sheet URL is missing. Please check your .env file.');
    }
    
    const url = `${SCRIPT_URL}?action=getAllData&_=${Date.now()}`;
    console.log('Fetching data from Google Script...');
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data loaded successfully');
    return data;
  } catch (e: any) {
    console.error('Fetch Error Details:', e);
    
    if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
      throw new Error(`Connection Failed: Google Script tak pohanch nahi pa rahe.
      
Mumkina Hal:
1. Browser mein Ad-Blocker (uBlock/AdBlock) ko OFF karen.
2. App ko Incognito/Private window mein kholen.
3. Kisi doosre browser (Edge ya Firefox) mein check karen.
4. Mobile Hotspot par check karen.`);
    }
    throw e;
  }
};

const postData = async (action: string, payload: any, sheetName: string) => {
  try {
    if (!SCRIPT_URL) {
      throw new Error('Google Sheet URL is not configured.');
    }
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Use no-cors for POST to avoid preflight issues with Google Scripts
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action: action.toLowerCase(), data: payload, sheetName }),
    });
    
    // Note: with no-cors, we can't read the response body, but the action usually succeeds
    return { result: 'success' };
  } catch (e: any) {
    console.error('Post error details:', e);
    throw new Error('Failed to send data to Google Script. Please check your internet and Script deployment.');
  }
};

export const createRecord = (payload: any, sheetName: string) => postData('CREATE', payload, sheetName);
export const updateRecord = (payload: any, sheetName: string) => postData('UPDATE', payload, sheetName);
export const deleteRecord = (id: string, sheetName: string) => postData('DELETE', { id }, sheetName);
