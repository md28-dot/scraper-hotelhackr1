// hotelDetails.js

const express = require("express");
const playwright = require("playwright");
const router = express.Router();

// Utilisé pour aller chercher image + adresse à partir d'une page Booking.com
router.post("/scrape/hotel-details", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes("booking.com")) {
    return res.status(400).json({ success: false, error: "URL invalide" });
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { timeout: 45000 });
    await page.waitForTimeout(3000); // temps de chargement pour les images et adresse

    // Scrape l'image principale de l'hôtel
    const image = await page.$eval('img[loading="lazy"]', el => el.src);

    // Scrape l'adresse
    const address = await page.$eval('[data-node_tt_id*="location_score_tooltip"], .hp_address_subtitle', el => el.textContent.trim());

    await browser.close();
    return res.json({ success: true, data: { image, address } });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
