const express = require("express");
const cors = require("cors");
const playwright = require("playwright");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Scraping principal Booking
app.post("/scrape/booking", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { timeout: 45000 });

    await page.waitForSelector('[data-testid="property-card"]', { timeout: 15000 });
    const hotels = await page.$$eval('[data-testid="property-card"]', cards =>
      cards.map(card => {
        const name = card.querySelector("div[data-testid='title']")?.innerText.trim();
        const price = card.querySelector("span[data-testid='price-and-discounted-price']")?.innerText.trim() ||
                      card.querySelector("span[data-testid='price-and-discounted-price']")?.textContent.trim();
        const link = card.querySelector("a")?.href;
        return { name, price, link };
      })
    );

    await browser.close();
    res.json({ success: true, data: hotels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scraping Booking avec comparaison mobile vs desktop
app.post("/scrape/booking-compare", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    const launchBrowser = async userAgent => {
      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext({ userAgent });
      const page = await context.newPage();
      await page.goto(url, { timeout: 45000 });
      await page.waitForSelector('[data-testid="property-card"]', { timeout: 15000 });
      const hotels = await page.$$eval('[data-testid="property-card"]', cards =>
        cards.map(card => {
          const name = card.querySelector("div[data-testid='title']")?.innerText.trim();
          const price = card.querySelector("span[data-testid='price-and-discounted-price']")?.innerText.trim();
          const link = card.querySelector("a")?.href;
          return { name, price, link };
        })
      );
      await browser.close();
      return hotels;
    };

    const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X)";

    const [desktop, mobile] = await Promise.all([
      launchBrowser(desktopUA),
      launchBrowser(mobileUA)
    ]);

    const comparison = desktop.map((hotel, i) => {
      const mobileMatch = mobile.find(m => m.name === hotel.name);
      const desktopPrice = parseFloat(hotel.price?.replace(/[^0-9.]/g, "") || 0);
      const mobilePrice = parseFloat(mobileMatch?.price?.replace(/[^0-9.]/g, "") || 0);
      const diff = desktopPrice && mobilePrice ? mobilePrice - desktopPrice : 0;
      return {
        name: hotel.name,
        price_desktop: hotel.price,
        price_mobile: mobileMatch?.price || "N/A",
        diff_percent: desktopPrice ? ((diff / desktopPrice) * 100).toFixed(2) : 0,
        cheaper_on: diff === 0 ? "equal" : diff < 0 ? "mobile" : "desktop",
        link: hotel.link
      };
    });

    res.json({ success: true, comparison });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scraping adresse + image d’un hôtel
app.post("/scrape/hotel-details", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { timeout: 45000 });

    await page.waitForSelector("img[data-testid='image']", { timeout: 15000 });
    const image = await page.$eval("img[data-testid='image']", el => el.src);
    const address = await page.$eval("span[data-testid='address']", el => el.innerText.trim());

    await browser.close();
    res.json({ success: true, data: { image, address } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
