/* Adds the permissions UPAI needs to the generated AndroidManifest.xml.
   Safe to run repeatedly - it checks before inserting. */
const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, "..", "android", "app", "src", "main", "AndroidManifest.xml");

if (!fs.existsSync(manifestPath)) {
  console.log("ℹ️  android/ not generated yet - run `npx cap add android` first.");
  process.exit(0);
}

let xml = fs.readFileSync(manifestPath, "utf8");

const permissions = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.VIBRATE",
  "android.permission.RECORD_AUDIO",
  "android.permission.READ_MEDIA_IMAGES",
];

let added = 0;
let block = "";
permissions.forEach((p) => {
  if (!xml.includes(`android:name="${p}"`)) {
    block += `    <uses-permission android:name="${p}" />\n`;
    added++;
  }
});

if (block) {
  xml = xml.replace("</manifest>", block + "</manifest>");
}

// Speech recognition needs a <queries> entry on Android 11+
if (!xml.includes("android.speech.RecognitionService")) {
  const queries = `    <queries>
        <intent>
            <action android:name="android.speech.RecognitionService" />
        </intent>
    </queries>\n`;
  xml = xml.replace("</manifest>", queries + "</manifest>");
  added++;
}

fs.writeFileSync(manifestPath, xml);
console.log(`✅ AndroidManifest patched (${added} entries added).`);
