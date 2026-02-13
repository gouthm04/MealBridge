const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const foodRoutes = require("./routes/foodRoutes");   // ADD THIS LINE

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);   // ADD THIS LINE

app.get("/", (req, res) => {
  res.send("Meal-Bridge backend running");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
