const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true, // keeps it in sync with external UUIDs
      index: true,
    },
    event_name: {
      type: String,
      required: true,
      trim: true,
    },
    source: String,
    event_venue: {
      type: String,
      trim: true,
    },
    category_name: {
      type: String,
      trim: true,
    },
    event_poster: {
      type: String,
      trim: true,
    },
    is_live: {
      type: Boolean,
      default: false,
    },
    has_streams: {
      type: Boolean,
      default: false,
    },
    recommend: {
      type: Boolean,
      default: false,
    },
    store_name: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      maxlength: 3, // ISO country code
      trim: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
