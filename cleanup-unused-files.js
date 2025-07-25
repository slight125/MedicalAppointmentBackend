const fs = require('fs');
const path = require('path');

// Files to remove (unused PowerShell test files and duplicates)
const filesToRemove = [
  'simple-test.ps1',
  'test-admin-user-management.ps1',
  'test-all-csv-exports.ps1',
  'test-analytics.ps1',
  'test-csv-export.ps1',
  'test-enhanced.ps1',
  'test-medical-history.ps1',
  'test-prescription-pdf.ps1',
  'test-prescriptions.ps1',
  'test-webhook.ps1',
  'simple-test.js',
  'test-webhook-simple.js',
  'test-webhook.js',
  'run-tests.bat',
  'test-simple.bat',
  'test-webhook.bat'
];

console.log('🧹 Starting cleanup of unused test files...');

filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      console.log(`❌ Failed to remove ${file}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('🎉 Cleanup completed!');
console.log('📝 Note: Proper Jest tests are now available in the tests/ directory');
