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
  
  let newSlot = slot;
  
  // Handle specific conversions
  if (slot === '100') newSlot = '1';
  else if (slot === '200') newSlot = '2';
  else if (slot === '300') newSlot = '3';
  else if (slot === '400') newSlot = '4';
  else if (slot === '500') newSlot = '5';
  else if (slot === '600') newSlot = '6';
  else if (slot === '700') newSlot = '7';
  else if (slot === '800') newSlot = '8';
  else if (slot === '900') newSlot = '9';
  else if (slot === '910') newSlot = '10';
  else if (slot === '911') newSlot = '11';
  else if (slot === '912') newSlot = '12';
  
  const newIndex = `${page}.${newSlot}`;
  
  if (original !== newIndex) {
    changeCount++;
    if (changeCount <= 30) {
      console.log(`  ${original} → ${newIndex}`);
    }
  }
  
  return { ...coin, index: newIndex };
});

// Write back
fs.writeFileSync(dataFile, JSON.stringify(updatedCoins, null, 2), 'utf-8');

console.log(`\n... (showing first 30)`);
console.log(`Total: Cleaned ${changeCount} indices.`);

// Verify sort order
console.log('\nVerifying sort order for page 7:');
const page7 = updatedCoins.filter(c => c.index.startsWith('7.'));
page7.sort((a, b) => {
  const [aPage, aSlot] = a.index.split('.').map(Number);
  const [bPage, bSlot] = b.index.split('.').map(Number);
  if (aPage !== bPage) return aPage - bPage;
  return aSlot - bSlot;
});
console.log('Sorted:', page7.map(c => c.index).join(', '));
console.log('\n✓ Correct order: 7.1 < 7.2 < ... < 7.9 < 7.10 < 7.11 < 7.12');
