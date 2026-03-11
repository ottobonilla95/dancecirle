import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// CONTINENT SCHEMA
const continentSchema = new mongoose.Schema(
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
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    totalDancers: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
continentSchema.plugin(toJSON);

export default mongoose.models.Continent || mongoose.model("Continent", continentSchema);
