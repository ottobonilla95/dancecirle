import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const campaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    bodyText: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    ctaLink: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      trim: true,
      default: "Learn More",
    },
    filters: {
      countries: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Country",
        },
      ],
      danceStyles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DanceStyle",
        },
      ],
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "sent"],
      default: "draft",
    },
    sentAt: {
      type: Date,
    },
    sentBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

campaignSchema.plugin(toJSON);

export default mongoose.models.Campaign ||
  mongoose.model("Campaign", campaignSchema);
