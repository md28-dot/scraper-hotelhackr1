const { chromium } = require('playwright');

async function scrapeBooking(url) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // S'assurer que la page charge bien les résultats
    await page.waitForSelector("[data-testid='property-card'], .b978843432", { timeout: 30000 });

    const hotels = await page.$$eval("[data-testid='property-card']", cards => {
      return cards.map(card => {
        const name = card.querySelector('div[data-testid="title"]')?.innerText || 'N/A';
        const price = card.querySelector('[data-testid="price-and-discounted-price"]')?.innerText || 'N/A';
        const rating = card.querySelector('[data-testid="review-score"]')?.innerText || 'N/A';
        return { name, price, rating };
      });
    });

    await browser.close();
    return hotels;
  } catch (error) {
    console.error("❌ Erreur scraping Booking:", error);
    await browser.close();
    return [];
  }
}

module.exports = scrapeBooking;
