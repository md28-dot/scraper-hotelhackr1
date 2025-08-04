const playwright = require('playwright');

async function scrapeBooking(url) {
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Navigation vers : ${url}`);
    await page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });

    await page.waitForSelector('[data-testid="property-card"]', {
      timeout: 45000
    });

    const hotelCards = await page.$$('[data-testid="property-card"]');
    console.log(`✅ ${hotelCards.length} cartes d’hôtels détectées`);

    const data = [];

    for (let card of hotelCards) {
      const name = await card.$eval('[data-testid="title"]', el => el.innerText).catch(() => null);
      const price = await card.$eval('[data-testid="price-and-discounted-price"]', el => el.innerText).catch(() => null);
      const image = await card.$eval('img', el => el.src).catch(() => null);
      const link = await card.$eval('a', el => el.href).catch(() => null);

      if (name && price && link) {
        data.push({ name, price, image, link });
      }
    }

    if (data.length === 0) {
      console.warn('⚠️ Aucun hôtel n’a pu être extrait malgré la détection de cartes.');
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur dans le scraping :', error);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = scrapeBooking;
