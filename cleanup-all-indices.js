const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'coins-data.json');

// Read the data
const data = fs.readFileSync(dataFile, 'utf-8');
const coins = JSON.parse(data);

let changeCount = 0;

// Clean all indices
const updatedCoins = coins.map(coin => {
  const [page, slot] = coin.index.split('.');
  const original = coin.index;
  
  if (!slot) return coin;
  
  // Convert slot to number to remove leading/trailing zeros
  const slotNum = parseInt(slot);
  const newIndex = `${page}.${slotNum}`;
  
  if (original !== newIndex) {
    changeCount++;
    if (changeCount <= 20) {
      console.log(`  ${original} → ${newIndex}`);
    }
  }
  
  return { ...coin, index: newIndex };
});

// Write back
fs.writeFileSync(dataFile, JSON.stringify(updatedCoins, null, 2), 'utf-8');

console.log(`\nCleaned ${changeCount} indices total.`);
console.log('\nVerifying sort order examples:');
const examples = updatedCoins.filter(c => c.index.startsWith('7.'));
examples.sort((a, b) => {
  const [aPage, aSlot] = a.index.split('.').map(Number);
  const [bPage, bSlot] = b.index.split('.').map(Number);
  if (aPage !== bPage) return aPage - bPage;
  return aSlot - bSlot;
});
console.log('Page 7 indices in order:', examples.map(c => c.index).join(', '));
