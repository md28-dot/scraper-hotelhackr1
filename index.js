const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const scrapeBooking = require("./scrape-booking");
const scrapeBookingCompare = require("./scrape-booking-compare");

app.get("/", (req, res) => {
  res.send("HotelHackr scraper backend is running!");
});

// 🏨 Scraping Booking normal (30 à 60 hôtels triés par prix)
app.get("/scrape-booking", async (req, res) => {
  const city = req.query.city || "Paris";
  const checkIn = req.query.checkIn || "2025-07-15";
  const checkOut = req.query.checkOut || "2025-07-17";
  const adults = req.query.adults || "2";

  try {
    const hotels = await scrapeBooking(city, checkIn, checkOut, adults);
    res.json({ success: true, data: hotels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📱🖥️ Comparaison mobile vs desktop
app.get("/compare-device-prices", async (req, res) => {
  const city = req.query.city || "Paris";
  const checkIn = req.query.checkIn || "2025-07-15";
  const checkOut = req.query.checkOut || "2025-07-17";
  const adults = req.query.adults || "2";

  try {
    const comparison = await scrapeBookingCompare(city, checkIn, checkOut, adults);
    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
