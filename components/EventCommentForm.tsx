"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaStar } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";

interface EventCommentFormProps {
  eventId: string;
  isLoggedIn: boolean;
  hasCommented: boolean;
}

export default function EventCommentForm({ eventId, isLoggedIn, hasCommented }: EventCommentFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submitted, setSubmitted] = useState(hasCommented);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      alert(t('eventDetail.writeComment'));
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
        setSubmitted(true);
        router.refresh();
      } else {
        alert(data.error || t('eventDetail.failedToPost'));
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert(t('eventDetail.failedToPost'));
    } finally {
      setCommenting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="alert alert-info mb-6">
        <span>{t('eventDetail.signInToReview')}</span>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="alert alert-success mb-6">
        <span>{t('eventDetail.alreadyReviewed')}</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title">{t('eventDetail.leaveReview')}</h2>

        {/* Rating */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('eventDetail.rating')}</span>
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
            <span className="label-text">{t('eventDetail.comment')}</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder={t('eventDetail.sharePlaceholder')}
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
          {commenting ? t('eventDetail.posting') : t('eventDetail.postReview')}
        </button>
      </div>
    </div>
  );
}
