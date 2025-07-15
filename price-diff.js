const scrapeBookingCompare = require("./scrape-booking-compare");

function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

module.exports = async function getPriceDifferences(city, checkIn, checkOut, adults) {
  const result = await scrapeBookingCompare(city, checkIn, checkOut, adults);

  const mobileMap = new Map();
  result.mobile.forEach(hotel => {
    const key = normalizeTitle(hotel.name);
    mobileMap.set(key, hotel);
  });

  const compareResults = [];

  result.desktop.forEach(desktopHotel => {
    const key = normalizeTitle(desktopHotel.name);
    const mobileHotel = mobileMap.get(key);

    if (mobileHotel) {
      const priceDesktop = parseFloat(desktopHotel.price.replace(/[^0-9.]/g, ""));
      const priceMobile = parseFloat(mobileHotel.price.replace(/[^0-9.]/g, ""));

      if (!isNaN(priceDesktop) && !isNaN(priceMobile)) {
        const diffPercent = ((priceMobile - priceDesktop) / priceDesktop) * 100;

        compareResults.push({
          name: desktopHotel.name,
          price_desktop: `$${priceDesktop}`,
          price_mobile: `$${priceMobile}`,
          diff_percent: Math.round(diffPercent * 100) / 100,
          cheaper_on: diffPercent < 0 ? "mobile" : diffPercent > 0 ? "desktop" : "equal",
          link: desktopHotel.link || mobileHotel.link
        });
      }
    }
  });

  return compareResults;
};
