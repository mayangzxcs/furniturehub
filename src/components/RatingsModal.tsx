import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'

export default function RatingsModal() {
  const { profile } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [hasRated, setHasRated] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  // Check if user has already rated
  useEffect(() => {
    if (!profile) return

    async function checkUserRating() {
      if (!profile) return
      const { data } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (data) {
        setHasRated(true)
      } else {
        // Start modal display timer
        const timer = setTimeout(() => {
          setShowModal(true)
        }, 60000) // 1 minute

        return () => clearTimeout(timer)
      }
    }

    checkUserRating()
  }, [profile])

  // Set up recurring modal if user hasn't rated
  useEffect(() => {
    if (!profile || hasRated || showModal) return

    const interval = setInterval(() => {
      setShowModal(true)
    }, 600000) // 10 minutes

    return () => clearInterval(interval)
  }, [profile, hasRated, showModal])

  async function handleSubmitRating() {
    if (!profile || rating === 0) {
      showToast('Please select a rating', 'info')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('ratings').insert({
        user_id: profile.id,
        rating,
        comment: comment.trim(),
      })

      if (error) {
        showToast('Failed to submit rating', 'error')
      } else {
        showToast('Thank you for your rating!', 'success')
        setHasRated(true)
        setShowModal(false)
        setRating(0)
        setComment('')
      }
    } catch (err) {
      showToast('An error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleCloseModal() {
    setShowModal(false)
    setRating(0)
    setComment('')
  }

  if (!profile || !showModal || hasRated) return null

  return (
    <div className="ratings-modal-overlay" onClick={handleCloseModal}>
      <div className="ratings-modal" onClick={e => e.stopPropagation()}>
        <button className="ratings-modal-close" onClick={handleCloseModal}>
          <i className="bi bi-x-lg"></i>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--fh-primary)', marginBottom: '0.5rem' }}>How do you like us?</h2>
          <p style={{ opacity: 0.6 }}>Your feedback helps us improve</p>
        </div>

        {/* Star Rating */}
        <div className="rating-stars" style={{ marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              className={`rating-star ${star <= (hoverRating || rating) ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                fontSize: '2.5rem',
                background: 'none',
                border: 'none',
                color: star <= (hoverRating || rating) ? '#FFD700' : '#ddd',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginRight: '0.5rem',
              }}
            >
              <i className="bi bi-star-fill"></i>
            </button>
          ))}
        </div>

        {/* Comment Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            className="fh-form-control"
            placeholder="Add a comment (optional)"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            style={{ resize: 'none' }}
          />
          <small style={{ opacity: 0.6 }}>{comment.length}/500 characters</small>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleCloseModal}
            className="btn-fh-secondary btn flex-grow-1"
            style={{ background: 'rgba(0,0,0,0.05)', border: 'none', color: 'var(--fh-text)' }}
          >
            Later
          </button>
          <button
            onClick={handleSubmitRating}
            disabled={loading || rating === 0}
            className="btn-fh-primary btn flex-grow-1"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  )
}
