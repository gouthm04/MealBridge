const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");


// Signup endpoint
router.post("/signup", async (req, res) => {

  try {

    const { email, password, name, role, location } = req.body;

    // Basic validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    const userId = data.user.id;

    // Insert profile into users table
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: userId,
        name: name,
        role: role,
        location: location
      });

    if (profileError) {
      return res.status(400).json({
        error: profileError.message
      });
    }

    res.json({
      message: "Signup successful",
      userId: userId
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// Login endpoint
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required"
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    let profile = null;

    if (data?.user?.id) {
      const { data: profileData } = await supabase
        .from("users")
        .select("id, name, role, location")
        .eq("id", data.user.id)
        .single();

      profile = profileData || null;
    }

    res.json({
      message: "Login successful",
      user: data.user,
      session: data.session,
      profile
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


module.exports = router;
