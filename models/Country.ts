import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// COUNTRY SCHEMA
const countrySchema = new mongoose.Schema(
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
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    continent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Continent",
      required: true,
    },
    totalDancers: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Social/messaging group links for country dance communities
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
countrySchema.plugin(toJSON);

export default mongoose.models.Country || mongoose.model("Country", countrySchema);
