const playwright = require("playwright");

module.exports = async function scrapeBooking(city, checkIn, checkOut, adults) {
  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    city
  )}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}`;

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: "Mozilla/5.0" });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "networkidle" });

  // Attend que la structure des résultats soit présente
  await page.waitForSelector('[data-testid="property-card"]', { timeout: 15000 });

  const hotels = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="property-card"]');
    const results = [];

    cards.forEach(card => {
      const name = card.querySelector('[data-testid="title"]')?.innerText?.trim();
      const price = card.querySelector('[data-testid="price-and-discounted-price"], [data-testid="price"]')?.innerText?.trim();
      const link = card.querySelector("a")?.href;

      if (name && price && link) {
        results.push({ name, price, link });
      }
    });

    return results.slice(0, 10);
  });

  await browser.close();
  return hotels;
};
