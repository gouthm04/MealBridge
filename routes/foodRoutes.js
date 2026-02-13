const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");
const estimateFoodSafety = require("../aiService");


// ===============================
// Add food listing (Donor)
// ===============================
router.post("/add", async (req, res) => {

  try {

    const {
      food_type,
      quantity,
      prep_time,
      location,
      latitude,
      longitude,
      donor_id
    } = req.body;

    if (!food_type || !quantity || !prep_time || !location || !donor_id) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        error: "Quantity must be greater than 0"
      });
    }

    const aiResult = estimateFoodSafety(food_type, prep_time);

    const { data, error } = await supabase
      .from("food_listings")
      .insert({
        food_type,
        quantity,
        prep_time,
        location,
        latitude,
        longitude,
        donor_id,
        urgency: aiResult.urgency,
        expiry_time: aiResult.expiryTime,
        status: "available"
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Food added successfully",
      food: data
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


// ===============================
// Get nearby food within 15km radius
// ===============================
router.get("/nearby/:ngoId", async (req, res) => {

  try {

    const ngoId = req.params.ngoId;

    // Get NGO coordinates
    const { data: ngo, error: ngoError } = await supabase
      .from("users")
      .select("latitude, longitude")
      .eq("id", ngoId)
      .single();

    if (ngoError || !ngo) {
      return res.status(400).json({
        error: "NGO location not found"
      });
    }

    const ngoLat = ngo.latitude;
    const ngoLng = ngo.longitude;

    // Get available food
    const { data: foodListings, error } = await supabase
      .from("food_listings")
      .select("*")
      .eq("status", "available");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {

      const R = 6371;

      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    }

    const nearbyFood = foodListings.filter(food => {

      if (!food.latitude || !food.longitude) return false;

      const distance = calculateDistance(
        ngoLat,
        ngoLng,
        food.latitude,
        food.longitude
      );

      return distance <= 15;

    });

    res.json({
      count: nearbyFood.length,
      food: nearbyFood
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// ===============================
// NGO analytics (dashboard)
// ===============================
router.get("/ngo-analytics/:ngoId", async (req, res) => {

  try {

    const ngoId = req.params.ngoId;

    // Get completed donations received by NGO
    const { data, error } = await supabase
      .from("food_listings")
      .select(`
        id,
        food_type,
        quantity,
        location,
        completed_at,
        users!food_listings_donor_id_fkey(name)
      `)
      .eq("requested_by", ngoId)
      .eq("status", "completed");

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    // Calculate total quantity received
    const totalReceived = data.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Count number of donations
    const totalDonations = data.length;

    res.json({
      totalReceived,
      totalDonations,
      donations: data
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ===============================
// Get all available food
// ===============================
router.get("/available", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("food_listings")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


// ===============================
// NGO requests food
// ===============================
router.put("/request/:foodId", async (req, res) => {

  try {

    const { ngo_id } = req.body;

    if (!ngo_id) {
      return res.status(400).json({
        error: "ngo_id required"
      });
    }

    const { data, error } = await supabase
      .from("food_listings")
      .update({
        requested_by: ngo_id,
        status: "requested"
      })
      .eq("id", req.params.foodId)
      .eq("status", "available")
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({
        error: "Food unavailable or already requested"
      });
    }

    res.json({
      message: "Food requested successfully",
      data
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


// ===============================
// Mark donation completed
// ===============================
router.put("/complete/:foodId", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("food_listings")
      .update({
        status: "completed",
        completed_at: new Date()
      })
      .eq("id", req.params.foodId)
      .eq("status", "requested")
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({
        error: "Food must be requested first"
      });
    }

    res.json({
      message: "Donation marked completed",
      data
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// ===============================
// Get donor listings (Donation history)
// ===============================
router.get("/donor-listings/:donorId", async (req, res) => {

  try {

    const donorId = req.params.donorId;

    const { data, error } = await supabase
      .from("food_listings")
      .select(`
        id,
        food_type,
        quantity,
        location,
        urgency,
        status,
        created_at,
        expiry_time,
        requested_by,
        users!food_listings_requested_by_fkey(name)
      `)
      .eq("donor_id", donorId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.json({
      count: data.length,
      listings: data
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ===============================
// Donor analytics
// ===============================
router.get("/donor-analytics/:donorId", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("food_listings")
      .select("quantity")
      .eq("donor_id", req.params.donorId)
      .eq("status", "completed");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const totalDonated = data.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.json({ totalDonated });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


// ===============================
module.exports = router;
