// AI-like food safety estimation service (rule-based)

const foodRules = [

  {
    category: "cooked_grains",
    keywords: ["rice", "biryani", "pulao", "fried rice", "noodles"],
    safeHours: 4
  },

  {
    category: "cooked_meat",
    keywords: ["chicken", "beef", "mutton", "fish", "meat", "curry"],
    safeHours: 4
  },

  {
    category: "vegetable_dishes",
    keywords: ["vegetable", "sabzi", "dal", "lentil", "sambar"],
    safeHours: 6
  },

  {
    category: "dairy",
    keywords: ["milk", "paneer", "cheese", "yogurt", "curd"],
    safeHours: 6
  },

  {
    category: "bread",
    keywords: ["bread", "bun", "roti", "naan", "chapati"],
    safeHours: 24
  },

  {
    category: "fruits",
    keywords: ["fruit", "apple", "banana", "orange", "grape"],
    safeHours: 24
  },

  {
    category: "packaged_food",
    keywords: ["packaged", "sealed", "packet", "biscuit", "snack"],
    safeHours: 48
  },

  {
    category: "dry_food",
    keywords: ["nuts", "chips", "dry", "snacks"],
    safeHours: 72
  }

];


// Identify food category and safe hours
function getSafeHours(foodType) {

  if (!foodType) return 6;

  const lowerFood = foodType.toLowerCase();

  for (let rule of foodRules) {

    for (let keyword of rule.keywords) {

      if (lowerFood.includes(keyword)) {
        return rule.safeHours;
      }

    }

  }

  // default fallback
  return 6;
}


// Calculate urgency level
function calculateUrgency(expiryTime) {

  const now = new Date();

  const hoursLeft = (expiryTime - now) / (1000 * 60 * 60);

  if (hoursLeft <= 2) return "High";

  if (hoursLeft <= 6) return "Medium";

  return "Low";
}


// Main AI estimation function
function estimateFoodSafety(foodType, prepTime) {

  try {

    const safeHours = getSafeHours(foodType);

    const prepDate = new Date(prepTime);

    if (isNaN(prepDate)) {
      throw new Error("Invalid preparation time");
    }

    const expiryTime = new Date(prepDate);

    expiryTime.setHours(expiryTime.getHours() + safeHours);

    const urgency = calculateUrgency(expiryTime);

    return {

      safeHours: safeHours,

      expiryTime: expiryTime.toISOString(),

      urgency: urgency

    };

  } catch (error) {

    console.error("AI estimation error:", error);

    return {

      safeHours: 6,

      expiryTime: null,

      urgency: "Medium"

    };

  }

}


module.exports = estimateFoodSafety;
