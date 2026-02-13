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

// Get donor analytics
router.get("/donor-analytics/:donorId", async (req, res) => {

  try {

    const donorId = req.params.donorId;

    // Get completed donations
    const { data, error } = await supabase
      .from("food_listings")
      .select(`
        quantity,
        requested_by,
        completed_at,
        users!food_listings_requested_by_fkey(name)
      `)
      .eq("donor_id", donorId)
      .not("completed_at", "is", null);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Calculate total donated
    const totalDonated = data.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Count NGO frequency
    const ngoCount = {};

    data.forEach(item => {

      const ngoName = item.users?.name;

      if (!ngoName) return;

      ngoCount[ngoName] = (ngoCount[ngoName] || 0) + 1;

    });

    const ngoRank = Object.entries(ngoCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      totalDonated,
      ngoRank
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// Get total donation quantity for donor
router.get("/donor-total/:donorId", async (req, res) => {

  try {

    const donorId = req.params.donorId;

    const { data, error } = await supabase
      .from("food_listings")
      .select("quantity")
      .eq("donor_id", donorId)
      .eq("status", "completed");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const totalDonated = data.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.json({
      totalDonated
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// Get most frequent NGOs donor donated to
router.get("/donor-top-ngos/:donorId", async (req, res) => {

  try {

    const donorId = req.params.donorId;

    const { data, error } = await supabase
      .from("food_listings")
      .select(`
        requested_by,
        users!food_listings_requested_by_fkey(name)
      `)
      .eq("donor_id", donorId)
      .eq("status", "completed");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const ngoCount = {};

    data.forEach(item => {

      const ngoName = item.users?.name;

      if (!ngoName) return;

      ngoCount[ngoName] = (ngoCount[ngoName] || 0) + 1;

    });

    const rankedNGOs = Object.entries(ngoCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json(rankedNGOs);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

router.get("/donor-listings/:donorId", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("food_listings")
      .select("*")
      .eq("donor_id", req.params.donorId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

router.put("/complete/:foodId", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("food_listings")
      .update({
        status: "completed",
        completed_at: new Date()
      })
      .eq("id", req.params.foodId)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Donation marked completed",
      data
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});
