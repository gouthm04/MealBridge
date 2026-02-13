const estimateFoodSafety = require("../aiService");

router.post("/add", async (req, res) => {

  const {
    food_type,
    quantity,
    prep_time,
    location,
    donor_id
  } = req.body;

  const aiResult = estimateFoodSafety(food_type, prep_time);

  const { data, error } = await supabase
    .from("food_listings")
    .insert({
      food_type,
      quantity,
      prep_time,
      location,
      donor_id,
      urgency: aiResult.urgency,
      expiry_time: aiResult.expiryTime
    })
    .select();

  res.json(data);

});
