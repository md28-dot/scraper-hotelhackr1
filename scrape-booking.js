const playwright = require("playwright");

module.exports = async function scrapeBooking(city, checkIn, checkOut, adults, maxPages = 3) {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}`;

  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);

  const allResults = [];
  let currentPage = 1;

  while (currentPage <= maxPages) {
    console.log(`Scraping page ${currentPage}...`);
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
      return results;
    });

    allResults.push(...hotels);

    const nextButton = await page.$("button[aria-label='Next page'], a[aria-label='Next page']");
    if (!nextButton) break;

    await nextButton.click();
    await page.waitForTimeout(5000);
    currentPage++;
  }

  await browser.close();

  // Supprimer doublons par lien
  const uniqueResults = Array.from(new Map(allResults.map(obj => [obj.link, obj])).values());

  // Trier par prix croissant
  const sorted = uniqueResults.sort((a, b) => {
    const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ""));
    const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ""));
    return priceA - priceB;
  });

  return sorted;
};
