const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");

const ERNAKULAM_BOUNDARY = [
  [10.355, 76.08],
  [10.36, 76.42],
  [10.24, 76.76],
  [9.83, 76.79],
  [9.71, 76.44],
  [9.76, 76.09],
  [9.98, 75.98]
];

function isPointInPolygon(lat, lng, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    const intersects =
      (latI > lat) !== (latJ > lat) &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;

    if (intersects) inside = !inside;
  }

  return inside;
}

function isWithinErnakulam(lat, lng) {
  return isPointInPolygon(lat, lng, ERNAKULAM_BOUNDARY);
}

async function geocodeLocation(locationText) {
  const rawQuery = String(locationText || "").trim();
  if (!rawQuery) return null;

  const query = rawQuery.toLowerCase().includes("ernakulam")
    ? rawQuery
    : `${rawQuery}, Ernakulam, Kerala, India`;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&bounded=1&viewbox=75.98,10.36,76.79,9.71&limit=1&q=${encodeURIComponent(
      query
    )}`
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) return null;
  if (!Array.isArray(data) || !data.length) return null;

  const latitude = Number(data[0].lat);
  const longitude = Number(data[0].lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    resolvedLocation: data[0].display_name || rawQuery
  };
}


// Signup endpoint
router.post("/signup", async (req, res) => {

  try {

    const { email, password, name, role, location } = req.body;
    const normalizedRole = String(role || "").toLowerCase().trim();
    const normalizedLocation = String(location || "").trim();

    // Basic validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    if (!["donor", "ngo"].includes(normalizedRole)) {
      return res.status(400).json({
        error: "Role must be donor or ngo"
      });
    }

    if (normalizedRole === "ngo" && !normalizedLocation) {
      return res.status(400).json({
        error: "Location is required for NGO registration"
      });
    }

    let geocodedLocation = null;
    if (normalizedLocation) {
      geocodedLocation = await geocodeLocation(normalizedLocation);
    }

    if (normalizedRole === "ngo") {
      if (!geocodedLocation) {
        return res.status(400).json({
          error: "Could not detect NGO location. Please enter a valid Ernakulam location."
        });
      }

      if (
        !isWithinErnakulam(
          geocodedLocation.latitude,
          geocodedLocation.longitude
        )
      ) {
        return res.status(400).json({
          error: "NGO location must be inside Ernakulam district"
        });
      }
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
        role: normalizedRole,
        location: geocodedLocation?.resolvedLocation || normalizedLocation || null,
        latitude: geocodedLocation?.latitude || null,
        longitude: geocodedLocation?.longitude || null
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
        .select("id, name, role, location, latitude, longitude")
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
