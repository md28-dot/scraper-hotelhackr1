const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const scrapeBooking = require("./scrape-booking");

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

app.get("/", (req, res) => {
  res.send("HotelHackr scraper backend is running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
