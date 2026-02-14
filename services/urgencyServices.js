const shelfLifeData = require("./shelfLifeData");

function estimateFoodSafety(foodType, prepTime) {

  const type = foodType.toLowerCase().replace(" ", "_");

  const shelfLifeHours =
    shelfLifeData[type] || 12; 

    const temperatureMultiplier = 0.8;
const adjustedShelfLife =
  shelfLifeHours * temperatureMultiplier;


  const prep = new Date(prepTime);
  const now = new Date();

  const elapsedHours =
    (now - prep) / (1000 * 60 * 60);

  const remainingHours =
    shelfLifeHours - elapsedHours;

  const expiryTime =
    new Date(prep.getTime() + shelfLifeHours * 60 * 60 * 1000);

  let urgency;

  const remainingPercent =
    remainingHours / shelfLifeHours;

  if (remainingPercent <= 0.25)
    urgency = "HIGH";

  else if (remainingPercent <= 0.5)
    urgency = "MEDIUM";

  else
    urgency = "LOW";

  return {
    urgency,
    expiryTime
  };

}

module.exports = estimateFoodSafety;
