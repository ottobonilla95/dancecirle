import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// CITY SCHEMA
const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    continent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Continent",
      required: true,
    },
    population: {
      type: Number,
      required: true,
    },
    totalDancers: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    // For sorting/ranking purposes
    rank: {
      type: Number,
      default: 0,
    },
    // Additional metadata
    coordinates: {
      lat: Number,
      lng: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Social/messaging group links for city dance communities
    socialGroups: {
      whatsapp: {
        type: String,
        trim: true,
      },
      line: {
        type: String,
        trim: true,
      },
      telegram: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
citySchema.plugin(toJSON);

export default mongoose.models.City || mongoose.model("City", citySchema);
