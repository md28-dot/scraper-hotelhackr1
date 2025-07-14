const scrapeBookingCompare = require("./scrape-booking-compare");

module.exports = async function getPriceDifferences(city, checkIn, checkOut, adults) {
  const result = await scrapeBookingCompare(city, checkIn, checkOut, adults);

  const compareResults = [];
  const mobileMap = new Map();

  result.mobile.forEach(hotel => {
    mobileMap.set(hotel.link, hotel);
  });

  result.desktop.forEach(desktopHotel => {
    const mobileHotel = mobileMap.get(desktopHotel.link);

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
          link: desktopHotel.link
        });
      }
    }
  });

  return compareResults;
};
