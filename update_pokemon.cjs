const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSetCards(setId, setName, outFileName) {
  console.log(`Fetching Pokémon set ${setId} (${setName})...`);
  const setUrl = `https://api.tcgdex.net/v2/fr/sets/${setId}`;
  
  const res = await fetch(setUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch set ${setId}: ${res.status}`);
  }
  
  const setInfo = await res.json();
  const rawCards = setInfo.cards || [];
  console.log(`Found ${rawCards.length} cards in set ${setId}. Fetching individual details...`);
  
  const results = [];
  const BATCH_SIZE = 30;
  
  for (let i = 0; i < rawCards.length; i += BATCH_SIZE) {
    const batch = rawCards.slice(i, i + BATCH_SIZE);
    console.log(`Fetching batch ${i / BATCH_SIZE + 1}/${Math.ceil(rawCards.length / BATCH_SIZE)}...`);
    
    const batchResults = await Promise.all(batch.map(async (briefCard) => {
      try {
        const detailRes = await fetch(`https://api.tcgdex.net/v2/fr/cards/${briefCard.id}`);
        if (!detailRes.ok) {
          throw new Error(`HTTP ${detailRes.status}`);
        }
        const card = await detailRes.json();
        
        const officialCount = card.set?.cardCount?.official || 100;
        const displayNo = `${card.localId}/${officialCount}`;
        
        const variantes = [];
        if (card.variants) {
          if (card.variants.normal) variantes.push('normale');
          if (card.variants.reverse) variantes.push('reverse');
          if (card.variants.holo) variantes.push('holo');
        }
        if (variantes.length === 0) {
          variantes.push('normale');
        }
        
        const possede = {};
        variantes.forEach(v => {
          possede[v] = false;
        });
        
        return {
          nom: card.name,
          numero: displayNo,
          set: setName,
          langue: 'FR',
          image: `${card.image}/low.png`,
          rarete: card.rarity || 'Commune',
          variantes: variantes,
          possede: possede,
          createdAt: Date.now()
        };
      } catch (err) {
        console.error(`Error fetching card ${briefCard.id}:`, err.message);
        // Fallback brief mapping
        return {
          nom: briefCard.name,
          numero: `${briefCard.localId}/100`,
          set: setName,
          langue: 'FR',
          image: `${briefCard.image}/low.png`,
          rarete: 'Commune',
          variantes: ['normale'],
          possede: { normale: false },
          createdAt: Date.now()
        };
      }
    }));
    
    results.push(...batchResults);
    await delay(100);
  }
  
  // Sort cards by localId numerically if possible
  results.sort((a, b) => {
    const numA = parseInt(a.numero.split('/')[0]) || 999;
    const numB = parseInt(b.numero.split('/')[0]) || 999;
    return numA - numB;
  });
  
  const destPath = path.join(__dirname, 'src/data/pokemon/fullsets', outFileName);
  fs.writeFileSync(destPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Saved ${results.length} cards to ${outFileName}`);
}

async function run() {
  try {
    await fetchSetCards('me02.5', 'Héros Transcendants', 'heros-transcendants.json');
    await fetchSetCards('me04', 'Chaos Ascendant', 'chaos-ascendant.json');
    console.log('Pokémon sets update completed successfully!');
  } catch (err) {
    console.error('Error updating Pokémon sets:', err);
    process.exit(1);
  }
}

run();
