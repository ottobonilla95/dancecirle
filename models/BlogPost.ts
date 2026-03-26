import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// BLOG POST SCHEMA
const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    locale: {
      type: String,
      required: true,
      enum: ["en", "es"],
      default: "en",
    },
    category: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    seo: {
      metaTitle: {
        type: String,
      },
      metaDescription: {
        type: String,
      },
      keywords: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound unique index on slug + locale
blogPostSchema.index({ slug: 1, locale: 1 }, { unique: true, sparse: true });

// add plugin that converts mongoose to json
blogPostSchema.plugin(toJSON);

export default mongoose.models.BlogPost ||
  mongoose.model("BlogPost", blogPostSchema);
