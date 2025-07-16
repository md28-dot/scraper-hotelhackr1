// index.js complet avec amélioration du scraping Booking (timeout, fallback, debug HTML)
const express = require("express");
const cors = require("cors");
const playwright = require("playwright");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Fonction d’extraction complète avec pagination + images + adresse
async function scrapeBookingHotels(url, userAgent = null) {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = userAgent
    ? await browser.newContext({ userAgent })
    : await browser.newContext();
  const page = await context.newPage();
  let results = [];
  let nextPage = url;
  let pageCount = 0;

  while (nextPage && pageCount < 3) {
    await page.goto(nextPage, { timeout: 45000 });
    await page.waitForLoadState("networkidle"); // attend que le réseau se calme
    await page.waitForTimeout(5000); // pause manuelle de 5 secondes

    const hasCards = await page.$('[data-testid="property-card"]');
    if (!hasCards) {
      const html = await page.content();
      console.error("❌ Aucun 'property-card' détecté. Extrait HTML :");
      console.error(html.slice(0, 2000));
      throw new Error("property-card non détecté après timeout");
    }

    const hotels = await page.$$eval('[data-testid="property-card"]', cards => {
      return cards.map(card => {
        const name = card.querySelector("div[data-testid='title']")?.innerText.trim();
        const price = card.querySelector("span[data-testid='price-and-discounted-price']")?.innerText.trim();
        const link = card.querySelector("a")?.href;
        const image = card.querySelector("img")?.src;
        const address = card.querySelector("span[data-testid='address']")?.innerText.trim();
        return { name, price, link, image, address };
      });
    });

    results = results.concat(hotels);

    const nextLink = await page.$("a[aria-label='Next page']");
    if (nextLink) {
      const href = await nextLink.getAttribute("href");
      nextPage = href ? "https://www.booking.com" + href : null;
    } else {
      nextPage = null;
    }

    pageCount++;
  }

  await browser.close();
  return results;
}

// Route principale avec comparaison desktop/mobile + détails
app.post("/search-with-details", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X)";

    const [desktopHotels, mobileHotels] = await Promise.all([
      scrapeBookingHotels(url, desktopUA),
      scrapeBookingHotels(url, mobileUA)
    ]);

    const merged = desktopHotels.map(dh => {
      const mh = mobileHotels.find(m => m.name === dh.name);
      const desktopPrice = parseFloat(dh.price?.replace(/[^0-9.]/g, "") || 0);
      const mobilePrice = parseFloat(mh?.price?.replace(/[^0-9.]/g, "") || 0);
      const diff = mobilePrice - desktopPrice;

      return {
        name: dh.name,
        link: dh.link,
        image: dh.image,
        address: dh.address,
        price_desktop: dh.price,
        price_mobile: mh?.price || "N/A",
        diff_percent: desktopPrice ? ((diff / desktopPrice) * 100).toFixed(2) : 0,
        cheaper_on: diff === 0 ? "equal" : diff < 0 ? "mobile" : "desktop"
      };
    });

    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
