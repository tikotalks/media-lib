import fs from "fs";
import { google } from "googleapis";
import path from "path";
import { camelCase, kebabCase, upperSnakeCase } from "@sil/case";
import dotenv from "dotenv";

const SHEET_ID = "1Di-f50XnbR7WlX-R9_47ydfuD5Huo-dq_pR-yxbnSIY";
const RANGE = "Sheet1!A1:Z1000"; // Adjust based on your sheet's data range

async function fetchSheetData() {
  // Load environment variables
  dotenv.config();

  // Log environment variables for debugging
  console.log("Checking environment variables...");
  console.log("GOOGLE_SERVICE_TYPE:", process.env.GOOGLE_SERVICE_TYPE);
  console.log("GOOGLE_PROJECT_ID:", process.env.GOOGLE_PROJECT_ID);
  console.log(
    "GOOGLE_PRIVATE_KEY_ID:",
    process.env.GOOGLE_PRIVATE_KEY_ID ? "✓ Present" : "✗ Missing"
  );
  console.log(
    "GOOGLE_PRIVATE_KEY:",
    process.env.GOOGLE_PRIVATE_KEY ? "✓ Present" : "✗ Missing"
  );
  console.log("GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("GOOGLE_AUTH_URI:", process.env.GOOGLE_AUTH_URI);
  console.log("GOOGLE_TOKEN_URI:", process.env.GOOGLE_TOKEN_URI);
  console.log(
    "GOOGLE_AUTH_PROVIDER_CERT_URL:",
    process.env.GOOGLE_AUTH_PROVIDER_CERT_URL
  );
  console.log("GOOGLE_CLIENT_CERT_URL:", process.env.GOOGLE_CLIENT_CERT_URL);

  try {
    // Ensure private key is properly formatted
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";

    // Remove quotes if present and normalize line endings
    privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

    // Validate private key format
    if (
      !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
      !privateKey.includes("-----END PRIVATE KEY-----")
    ) {
      throw new Error("GOOGLE_PRIVATE_KEY is not in valid PEM format");
    }

    if (!privateKey) {
      throw new Error("GOOGLE_PRIVATE_KEY is missing or invalid");
    }

    // Construct the service account credentials
    const credentials = {
      type: process.env.GOOGLE_SERVICE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
      universe_domain: "googleapis.com",
    };

    console.log("\nInitializing Google Auth...");
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    console.log("\nInitializing Google Sheets API...");
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error("No data found in the Google Sheet.");
    }

    // Convert the rows into JSON format
    const headers = rows[0];
    console.log(`\nProcessing ${rows.length - 1} images...`);

    const categories = new Set();
    const tags = new Set();

    const jsonData = rows.slice(1).map((row) => {
      return headers.reduce((obj, header, index) => {
        const headerKey = camelCase(header);
        if (headerKey == "tags" || headerKey == "category") {
          const values = row[index]
            ? row[index].split(",").map((tag) => tag.trim())
            : [];
          obj[headerKey] = values;
          if (headerKey === "category")
            values.forEach((cat) => categories.add(cat));
          if (headerKey === "tags") values.forEach((tag) => tags.add(tag));
          return obj;
        } else if (headerKey.includes("url")) {
          if (!obj["url"]) obj["url"] = {};
          obj["url"][camelCase(headerKey.replace("url", ""))] =
            row[index] || "";
        } else {
          obj[camelCase(headerKey)] = row[index] || "";
        }
        obj.name = kebabCase((obj.filename || "").replace(".png", ""));
        return obj;
      }, {});
    });

    console.log(
      `Found ${categories.size} categories: ${Array.from(categories).join(
        ", "
      )}`
    );
    console.log(`Found ${tags.size} unique tags`);

    // Fix the jsonData by making sure no 2 .name are the same. If there is a double, we add a number after it.
    const nameCounts = {};
    jsonData.forEach((image) => {
      const name = kebabCase(image.name);
      const count = nameCounts[name] || 0;
      nameCounts[name] = count + 1;
      if (count > 0) {
        image.name = kebabCase(`${name}-${count + 1}`);
      }
    });

    // Save JSON data
    const outputPath = path.resolve("src/data/images.ts");
    fs.writeFileSync(
      outputPath,
      `import { ImageData } from "../types";
export const images:ImageData[] = ${JSON.stringify(jsonData, null, 2)}
`
    );

    // Make sure there are no doubles, if an entry already exist, add a number after the name;

    const outputTypePath = path.resolve("src/data/image.ts");
    fs.writeFileSync(
      outputTypePath,
      `export const Image = {
${Array.from(jsonData)
  .map((image) => `\t${upperSnakeCase(image.name)}: '${kebabCase(image.name)}'`)
  .join(",\n")}
      }
  export type Image = typeof Image[keyof typeof Image];
  `
    );

    console.log(`\n✅ Data fetched and saved to ${outputPath}`);
    console.log(`Total images processed: ${jsonData.length}`);
  } catch (error) {
    console.error("Error during Google Sheets data fetch:", error);
    process.exit(1);
  }
}

fetchSheetData().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
