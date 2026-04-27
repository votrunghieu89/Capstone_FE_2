const fs = require('fs');
const file = 'D:/FASTFIX_CAP2/Capstone_FE_2/Capstone_FE_2/src/components/technician/InProgress.tsx';
let content = fs.readFileSync(file, 'utf8');

// Decode \uXXXX sequences
content = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
});

fs.writeFileSync(file, content, 'utf8');
console.log('Decoded Unicode escapes correctly.');
