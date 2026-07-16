const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mapRarity(raw) {
  const r = raw.trim().toUpperCase();
  if (r === 'L') return 'Leader';
  if (r === 'C') return 'Commune';
  if (r === 'UC') return 'Peu Commune';
  if (r === 'R') return 'Rare';
  if (r === 'SR') return 'Super Rare';
  if (r === 'SCR' || r === 'SEC') return 'Secret Rare';
  if (r === 'PR') return 'Promo';
  return raw;
}

function cleanName(rawName) {
  return rawName.replace(/^[A-Z0-9-]+\s+/, '').trim();
}

async function scrapeSet(setId, categoryValue, setName) {
  console.log(`Scraping set ${setId} (${setName})...`);
  const listUrl = `https://www.dbs-cardgame.com/fw/en/cardlist/?search=true&category%5B%5D=${categoryValue}`;
  
  const response = await fetch(listUrl, {
    headers: { 'User-Agent': USER_AGENT }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch set list page: ${response.status}`);
  }
  
  const html = await response.text();
  
  const parts = html.split('<li class="cardItem">');
  const cardsToFetch = [];
  
  for (let idx = 1; idx < parts.length; idx++) {
    const block = parts[idx];
    const detailMatch = block.match(/detail\.php\?([^" >]+)/);
    const imgMatch = block.match(/data-src="([^"]+?\.webp)"/);
    const altMatch = block.match(/alt="([^"]+?)"/);
    
    if (!detailMatch || !imgMatch || !altMatch) continue;
    
    const detailParams = detailMatch[1]; // card_no=FB04-001 or card_no=FB04-001&p=_p1
    const imgDataSrc = imgMatch[1];     // ../../images/cards/card/en/FB04-001_f.webp
    const altText = altMatch[1];         // FB04-001 Son Goku
    
    // Parse card number and potential parallel suffix from detailParams
    const cardNoMatch = detailParams.match(/card_no=([A-Z0-9-]+)/i);
    if (!cardNoMatch) continue;
    const baseCardNo = cardNoMatch[1];
    
    const pMatch = detailParams.match(/&p=([^&]+)/);
    const suffix = pMatch ? pMatch[1] : '';
    
    const isAlt = !!suffix || imgDataSrc.includes('_p');
    
    // Resolve absolute image URL
    let absoluteImgUrl = imgDataSrc;
    if (absoluteImgUrl.startsWith('../../')) {
      absoluteImgUrl = 'https://www.dbs-cardgame.com/fw/' + absoluteImgUrl.slice(6);
    } else if (absoluteImgUrl.startsWith('../')) {
      absoluteImgUrl = 'https://www.dbs-cardgame.com/fw/' + absoluteImgUrl.slice(3);
    }
    
    let displayCardNo = baseCardNo;
    if (suffix) {
      displayCardNo = `${baseCardNo}${suffix}`;
    } else if (isAlt) {
      // Find suffix from image URL if not in params
      const imgNameMatch = imgDataSrc.match(new RegExp(`${baseCardNo}_([A-Za-z0-9_]+)\\.webp`, 'i'));
      if (imgNameMatch) {
        displayCardNo = `${baseCardNo}_${imgNameMatch[1]}`;
      }
    }
    
    let displayName = cleanName(altText);
    if (isAlt) {
      displayName = `${displayName} (Alt)`;
    }
    
    cardsToFetch.push({
      detailUrl: `https://www.dbs-cardgame.com/fw/en/cardlist/detail.php?${detailParams}`,
      baseCardNo,
      displayCardNo,
      displayName,
      image: absoluteImgUrl,
      isAlt
    });
  }
  
  console.log(`Found ${cardsToFetch.length} card variants in list. Fetching details...`);
  
  const results = [];
  const BATCH_SIZE = 15;
  
  for (let i = 0; i < cardsToFetch.length; i += BATCH_SIZE) {
    const batch = cardsToFetch.slice(i, i + BATCH_SIZE);
    console.log(`Fetching card details batch ${i / BATCH_SIZE + 1}/${Math.ceil(cardsToFetch.length / BATCH_SIZE)}...`);
    
    const batchResults = await Promise.all(batch.map(async (card) => {
      try {
        const detailRes = await fetch(card.detailUrl, {
          headers: { 'User-Agent': USER_AGENT }
        });
        if (!detailRes.ok) {
          throw new Error(`HTTP error ${detailRes.status}`);
        }
        const detailHtml = await detailRes.text();
        
        // Extract rarity: <div class="rarity">L</div>
        const rarityMatch = detailHtml.match(/<div class="rarity">([\s\S]*?)<\/div>/i);
        const rawRarity = rarityMatch ? rarityMatch[1].trim() : 'C';
        const rarity = mapRarity(rawRarity);
        
        // Extract category/type: <h6>Card type</h6> <div class="data">LEADER</div>
        const typeMatch = detailHtml.match(/<h6>Card type<\/h6>[\s\S]*?<div class="data">([\s\S]*?)<\/div>/i);
        const category = typeMatch ? typeMatch[1].trim().toUpperCase() : 'BATTLE';
        
        return {
          nom: card.displayName,
          numero: card.displayCardNo,
          set: setName,
          langue: 'FR',
          image: card.image,
          rarete: rarity,
          category: category,
          variantes: ['normale'],
          possede: {
            normale: false
          },
          createdAt: Date.now()
        };
      } catch (err) {
        console.error(`Error scraping card ${card.displayCardNo}:`, err.message);
        // Return fallback data if fetch fails
        return {
          nom: card.displayName,
          numero: card.displayCardNo,
          set: setName,
          langue: 'FR',
          image: card.image,
          rarete: 'Commune',
          category: 'BATTLE',
          variantes: ['normale'],
          possede: {
            normale: false
          },
          createdAt: Date.now()
        };
      }
    }));
    
    results.push(...batchResults);
    await delay(200); // polite delay
  }
  
  return results;
}

async function run() {
  try {
    // FB04 - BOOSTER PACK -ULTRA LIMIT-
    const fb04Cards = await scrapeSet('FB04', '583004', 'FB04 - Limitless Ultra');
    fs.writeFileSync(
      path.join(__dirname, 'src/data/dragonball/fb04.json'),
      JSON.stringify(fb04Cards, null, 2),
      'utf-8'
    );
    console.log(`Successfully generated fb04.json with ${fb04Cards.length} cards!`);
    
    // FB09 - BOOSTER PACK -DUAL EVOLUTION-
    const fb09Cards = await scrapeSet('FB09', '583009', 'FB09 - Ultimate Fusion');
    fs.writeFileSync(
      path.join(__dirname, 'src/data/dragonball/fb09.json'),
      JSON.stringify(fb09Cards, null, 2),
      'utf-8'
    );
    console.log(`Successfully generated fb09.json with ${fb09Cards.length} cards!`);
    
  } catch (err) {
    console.error('Fatal error in scraper:', err);
    process.exit(1);
  }
}

run();
