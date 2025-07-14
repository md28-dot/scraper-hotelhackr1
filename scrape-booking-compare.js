const playwright = require("playwright");

module.exports = async function scrapeBookingCompare(city, checkIn, checkOut, adults, maxPages = 1) {
  const results = {
    desktop: [],
    mobile: []
  };

  // Définir les user-agent pour desktop et mobile
  const userAgents = {
    desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0 Safari/537.36",
    mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
  };

  for (const device of ["desktop", "mobile"]) {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: userAgents[device],
      viewport: device === "mobile" ? { width: 375, height: 812 } : { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000); // Attente pour le chargement dynamique

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

    await browser.close();

    // Éliminer les doublons par lien
    const unique = Array.from(new Map(hotels.map(h => [h.link, h])).values());

    // Trier les hôtels par prix croissant
    const sorted = unique.sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ""));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ""));
      return priceA - priceB;
    });

    results[device] = sorted;
  }

  return results;
};
