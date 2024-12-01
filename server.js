const express = require("express");
const mongoose = require("mongoose");
const validUrl = require("valid-url");
const { v4: uuidv4 } = require("uuid"); // Import UUID v4 function
require("dotenv").config();

const Url = require("./models/Url");

// Initialize the app
const app = express();
app.use(express.json()); // for parsing application/json

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// Endpoint to shorten URL
app.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;

  // Validate URL
  if (!validUrl.isUri(originalUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // Check if URL already exists
  const existingUrl = await Url.findOne({ originalUrl });
  if (existingUrl) {
    return res.json({
      originalUrl: existingUrl.originalUrl,
      shortUrl: `http://localhost:${process.env.PORT}/${existingUrl.shortUrl}`,
    });
  }

  // Create new shortened URL using UUID v4
  const shortUrl = uuidv4().split("-")[0]; // Generate a UUID and take the first part (8 characters)

  const newUrl = new Url({
    originalUrl,
    shortUrl,
  });

  await newUrl.save();

  res.json({
    originalUrl,
    shortUrl: `http://localhost:${process.env.PORT}/${shortUrl}`,
  });
});

// Redirect to original URL
app.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;

  const url = await Url.findOne({ shortUrl });
  url.count++;
  url.save();
  if (!url) {
    return res.status(404).json({ error: "Shortened URL not found" });
  }

  res.redirect(url.originalUrl);
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});