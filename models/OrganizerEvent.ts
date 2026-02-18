import mongoose, { Schema, models } from "mongoose";
import toJSON from "./plugins/toJSON";

const OrganizerEventSchema = new Schema(
  {
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    venue: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    city: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true,
      index: true,
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    flyerUrl: {
      type: String,
      trim: true,
      default: "",
    },
    priceAmount: {
      type: Number,
      min: 0,
    },
    priceCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: "USD",
    },
    ticketUrl: {
      type: String,
      trim: true,
      default: "",
    },
    danceStyles: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

OrganizerEventSchema.index({ city: 1, startsAt: 1, isPublished: 1 });
OrganizerEventSchema.index({ organizerId: 1, startsAt: -1 });

OrganizerEventSchema.plugin(toJSON);

const OrganizerEvent =
  models.OrganizerEvent ||
  mongoose.model("OrganizerEvent", OrganizerEventSchema);

export default OrganizerEvent;
