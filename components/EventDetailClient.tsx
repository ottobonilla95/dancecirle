"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaCalendar, FaMapMarkerAlt, FaStar } from "react-icons/fa";

interface EventData {
  _id: string;
  eventName: string;
  venue?: string;
  city: string;
  eventDate: string;
  description?: string;
  imageUrl?: string;
  genres: string[];
  averageRating: number;
  totalComments: number;
  djId: {
    _id: string;
    name: string;
    username: string;
    image?: string;
    city?: { name: string };
  };
}

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  userImage?: string;
  comment: string;
  rating: number;
  createdAt: string;
}

interface EventDetailClientProps {
  eventId: string;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [hasCommented, setHasCommented] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchComments();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/comments`);
      const data = await res.json();
      
      if (res.ok) {
        setComments(data.comments);
        // Check if current user has already commented
        if (session?.user) {
          const userComment = data.comments.find(
            (c: Comment) => c.userId === session.user.id
          );
          setHasCommented(!!userComment);
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!session) {
      alert("Please sign in to leave a comment");
      return;
    }

    if (!newComment.trim()) {
      alert("Please write a comment");
      return;
    }

    setCommenting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: newComment,
          rating: newRating,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewComment("");
        setNewRating(5);
        setHasCommented(true);
        fetchComments();
        fetchEvent(); // Refresh event to update average rating
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Event not found</h2>
          <button onClick={() => router.back()} className="btn btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm mb-4"
        >
          <FaArrowLeft /> Back
        </button>

        {/* Event Details */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            {event.imageUrl && (
              <div className="w-full h-64 rounded-lg overflow-hidden mb-4">
                <img
                  src={event.imageUrl}
                  alt={event.eventName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <h1 className="text-3xl font-bold mb-4">{event.eventName}</h1>
            
            <div className="space-y-2 text-base-content/70 mb-4">
              <p className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span>
                  {event.venue && `${event.venue} • `}
                  {event.city}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <FaCalendar />
                <span>
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            {event.description && (
              <p className="text-base-content/80 mb-4">{event.description}</p>
            )}

            {event.genres && event.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.genres.map((genre, index) => (
                  <span key={index} className="badge badge-primary">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* DJ Info */}
            <div className="divider">DJ</div>
            <Link
              href={`/dancer/${event.djId._id}`}
              className="flex items-center gap-3 hover:bg-base-300 p-3 rounded-lg transition-all"
            >
              {event.djId.image && (
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full">
                    <img src={event.djId.image} alt={event.djId.name} />
                  </div>
                </div>
              )}
              <div>
                <p className="font-semibold">{event.djId.name}</p>
                <p className="text-sm text-base-content/60">@{event.djId.username}</p>
              </div>
            </Link>

            {/* Rating Summary */}
            {event.totalComments > 0 && (
              <div className="mt-4 p-4 bg-base-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-500 text-xl" />
                  <span className="text-2xl font-bold">{event.averageRating.toFixed(1)}</span>
                  <span className="text-base-content/60">
                    ({event.totalComments} {event.totalComments === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Form */}
        {session ? (
          !hasCommented ? (
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <h2 className="card-title">Leave a Review</h2>
                
                {/* Rating */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Rating</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`text-3xl ${
                          star <= newRating ? "text-yellow-500" : "text-base-300"
                        }`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Comment</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Share your experience..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={500}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      {newComment.length}/500
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleSubmitComment}
                  className="btn btn-primary"
                  disabled={commenting || !newComment.trim()}
                >
                  {commenting ? "Posting..." : "Post Review"}
                </button>
              </div>
            </div>
          ) : (
            <div className="alert alert-success mb-6">
              <span>✓ You&apos;ve already reviewed this event</span>
            </div>
          )
        ) : (
          <div className="alert alert-info mb-6">
            <span>Please sign in to leave a review</span>
          </div>
        )}

        {/* Comments List */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">
              Reviews ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <p className="text-center text-base-content/60 py-8">
                No reviews yet. Be the first to review this event!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment._id} className="bg-base-300 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      {comment.userImage && (
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full">
                            <img src={comment.userImage} alt={comment.userName} />
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{comment.userName}</p>
                          <div className="flex items-center gap-1 text-yellow-500">
                            {[...Array(comment.rating)].map((_, i) => (
                              <FaStar key={i} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-base-content/60 mt-1">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-2">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

