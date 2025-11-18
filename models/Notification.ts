import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Query notifications by recipient frequently
    },
    
    // Type of notification
    type: {
      type: String,
      enum: [
        "new_music",           // Producer posted new music
        "friend_request",      // Someone sent friend request
        "friend_accepted",     // Friend request accepted
        "profile_liked",       // Someone liked profile
        "new_follower",        // Someone followed you
        "message",             // New direct message
        "comment",             // Someone commented on your post
        "like",                // Someone liked your post
      ],
      required: true,
      index: true,
    },
    
    // Who triggered this notification (optional)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    // Notification-specific data (flexible)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Query unread notifications frequently
    },
    
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete old read notifications after 30 days (optional cleanup)
notificationSchema.index(
  { readAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { isRead: true } 
  }
);

export default mongoose.models.Notification || 
  mongoose.model("Notification", notificationSchema);

