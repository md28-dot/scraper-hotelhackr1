const playwright = require("playwright");

module.exports = async function scrapeBooking(city, checkIn, checkOut, adults) {
  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    city
  )}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}`;

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0 Safari/537.36",
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(7000); // attendre le JS dynamique

  const hotels = await page.evaluate(() => {
    const results = [];

    document.querySelectorAll("div[data-testid]").forEach(el => {
      const title = el.querySelector("[data-testid='title']")?.innerText?.trim();
      const price =
        el.querySelector("[data-testid='price']")?.innerText?.trim() ||
        el.querySelector("[data-testid='price-and-discounted-price']")?.innerText?.trim();
      const link = el.querySelector("a")?.href;

      if (title && price && link && link.includes("/hotel/")) {
        results.push({ name: title, price, link });
      }
    });

    return results.slice(0, 10);
  });

  await browser.close();
  return hotels;
};
