const fs = require('fs');
const files = [
  'D:/FASTFIX_CAP2/Capstone_FE_2/Capstone_FE_2/src/components/technician/InProgress.tsx',
  'D:/FASTFIX_CAP2/Capstone_FE_2/Capstone_FE_2/src/components/technician/NewRequests.tsx',
  'D:/FASTFIX_CAP2/Capstone_FE_2/Capstone_FE_2/src/pages/technician/AcceptedRequestsPage.tsx',
  'D:/FASTFIX_CAP2/Capstone_FE_2/Capstone_FE_2/src/pages/technician/OrderDetailPage.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      const original = content;
      // Decode \uXXXX sequences to UTF-8
      content = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
          return String.fromCharCode(parseInt(grp, 16));
      });
      if (original !== content) {
          fs.writeFileSync(file, content, 'utf8');
          console.log('Decoded', file);
      }
  }
});
console.log('All done.');
