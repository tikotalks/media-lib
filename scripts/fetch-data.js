import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import { camelCase, kebabCase } from '@sil/case';
import dotenv from 'dotenv';

const SHEET_ID = '1Di-f50XnbR7WlX-R9_47ydfuD5Huo-dq_pR-yxbnSIY';
const RANGE = 'Sheet1!A1:Z1000'; // Adjust based on your sheet's data range

async function fetchSheetData() {
  // Load environment variables
  dotenv.config();

  // Log environment variables for debugging
  console.log('Checking environment variables...');
  console.log('GOOGLE_SERVICE_TYPE:', process.env.GOOGLE_SERVICE_TYPE);
  console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID);
  console.log('GOOGLE_PRIVATE_KEY_ID:', process.env.GOOGLE_PRIVATE_KEY_ID ? '✓ Present' : '✗ Missing');
  console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✓ Present' : '✗ Missing');
  console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL);
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('GOOGLE_AUTH_URI:', process.env.GOOGLE_AUTH_URI);
  console.log('GOOGLE_TOKEN_URI:', process.env.GOOGLE_TOKEN_URI);
  console.log('GOOGLE_AUTH_PROVIDER_CERT_URL:', process.env.GOOGLE_AUTH_PROVIDER_CERT_URL);
  console.log('GOOGLE_CLIENT_CERT_URL:', process.env.GOOGLE_CLIENT_CERT_URL);

  // Construct the service account credentials
  const credentials = {
    type: process.env.GOOGLE_SERVICE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: "googleapis.com"
  };

  console.log('\nInitializing Google Auth...');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  console.log('\nInitializing Google Sheets API...');
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    console.error('No data found in the Google Sheet.');
    return;
  }

  // Convert the rows into JSON format
  const headers = rows[0];
  console.log(`\nProcessing ${rows.length - 1} images...`);

  const categories = new Set();
  const tags = new Set();

  const jsonData = rows.slice(1).map(row => {
    return headers.reduce((obj, header, index) => {
      const headerKey = camelCase(header);
      if(headerKey == 'tags' || headerKey == 'category'){
        const values = row[index].split(',').map(tag => tag.trim());
        obj[headerKey] = values;
        if(headerKey === 'category') values.forEach(cat => categories.add(cat));
        if(headerKey === 'tags') values.forEach(tag => tags.add(tag));
        return obj;
      }
      else if(headerKey.includes('url')){
        if(!obj['url']) obj['url'] = {};
        obj['url'][camelCase(headerKey.replace('url',''))] = row[index] || '';
      } else {
        obj[camelCase(headerKey)] = row[index] || '';
      }
      obj.name = kebabCase((obj.filename || '').replace('.png',''));
      return obj;
    }, {});
  });

  console.log(`Found ${categories.size} categories: ${Array.from(categories).join(', ')}`);
  console.log(`Found ${tags.size} unique tags`);

  // Save JSON data
  const outputPath = path.resolve('src/data/images.ts');
  fs.writeFileSync(outputPath, `import { ImageData } from "../types";
export const images:ImageData[] = ${JSON.stringify(jsonData, null, 2)}`);

  console.log(`\n✅ Data fetched and saved to ${outputPath}`);
  console.log(`Total images processed: ${jsonData.length}`);
}

fetchSheetData().catch(console.error);
