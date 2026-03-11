import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// DANCE STYLE SCHEMA
const danceStyleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['latin', 'ballroom', 'street', 'contemporary', 'traditional'],
      default: 'latin',
    },
    isPartnerDance: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Sequence for ordering in onboarding and lists
    sequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
danceStyleSchema.plugin(toJSON);

export default mongoose.models.DanceStyle || mongoose.model("DanceStyle", danceStyleSchema); 