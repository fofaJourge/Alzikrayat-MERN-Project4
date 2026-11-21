// PhotoDetail page (route /photos/:id): shows the full-size photo, its metadata and its
// comments. Logged-in users can comment, and only the owner sees the Delete button.

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { createSocket } from '../socket'

function PhotoDetail() {
  // useParams reads the :id part of the URL /photos/:id
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [photo, setPhoto] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // GET /api/photos/:id returns the photo together with its comments
  const fetchPhoto = useCallback(async () => {
    try {
      setError('')

      const response = await api.get(`/photos/${id}`)

      setPhoto(response.data.photo)
      setComments(response.data.comments || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load this photo.'
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPhoto()
  }, [fetchPhoto])

  // Adds a comment to the list unless it is already there.
  // The author receives the comment twice (API response + socket event),
  // so we check the _id to avoid showing duplicates.
  const addCommentToList = useCallback((newComment) => {
    setComments((prev) =>
      prev.some((c) => c._id === newComment._id) ? prev : [...prev, newComment]
    )
  }, [])

  // Real-time comments: join this photo's room and listen for new comments
  useEffect(() => {
    const socket = createSocket()

    // 'connect' also fires after a reconnect, so the room is re-joined automatically
    socket.on('connect', () => socket.emit('photo:join', id))
    socket.on('comment:new', addCommentToList)

    // Cleanup when the page closes or the photo id changes
    return () => {
      socket.emit('photo:leave', id)
      socket.off('comment:new', addCommentToList)
      socket.disconnect()
    }
  }, [id, addCommentToList])

  // Show the Delete button only to the owner (the server checks ownership again)
  const ownerId = photo?.userId?._id || photo?.userId
  const currentUserId = user?._id || user?.id

  const isOwner =
    Boolean(currentUserId) &&
    String(ownerId) === String(currentUserId)

  // POST /api/photos/:id/comments; the new comment shows instantly and Socket.io pushes it to other viewers
  const handleComment = async (e) => {
    e.preventDefault()
    setCommentError('')

    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty.')
      return
    }

    setCommentLoading(true)

    try {
      const response = await api.post(`/photos/${id}/comments`, {
        comment: commentText,
      })

      setCommentText('')
      addCommentToList(response.data.comment)
    } catch (err) {
      setCommentError(
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Unable to add comment.'
      )
    } finally {
      setCommentLoading(false)
    }
  }

  // DELETE /api/photos/:id - the server verifies ownership and removes the file and record
  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this photo?'
    )

    if (!confirmed) return

    setDeleteLoading(true)

    try {
      await api.delete(`/photos/${id}`)
      navigate('/gallery')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete photo.'
      )
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="status-message">Loading photo...</div>
      </main>
    )
  }

  if (error && !photo) {
    return (
      <main className="page-container">
        <div className="error-message">{error}</div>
        <Link to="/gallery" className="btn btn-secondary">
          Back to Gallery
        </Link>
      </main>
    )
  }

  if (!photo) return null

  return (
    <main className="page-container detail-page">
      <Link to="/gallery" className="back-link">
        ← Back to Gallery
      </Link>

      {error && <div className="error-message">{error}</div>}

      <article className="photo-detail-card">
        <div className="detail-image-wrapper">
          <img
            src={`/uploads/${encodeURIComponent(photo.fileName)}`}
            alt={photo.title}
            className="detail-image"
          />
        </div>

        <div className="detail-content">
          <div className="detail-title-row">
            <div>
              <p className="eyebrow">Photo Details</p>
              <h1>{photo.title}</h1>
            </div>

            {isOwner && (
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Photo'}
              </button>
            )}
          </div>

          <p className="detail-description">
            {photo.description || 'No description provided.'}
          </p>

          <div className="detail-meta">
            <span>
              Uploaded by{' '}
              <strong>
                {photo.userId?.firstName || 'Unknown'}{' '}
                {photo.userId?.lastName || ''}
              </strong>
            </span>

            <span>
            {(photo.dateTime || photo.createdAt)
  ? new Date(photo.dateTime || photo.createdAt).toLocaleString()
  : ''}
            </span>
          </div>
        </div>
      </article>

      <section className="comments-section">
        <div className="section-heading">
          <p className="eyebrow">Community</p>
          <h2>Comments ({comments.length})</h2>
        </div>

        {isAuthenticated ? (
          <form
            onSubmit={handleComment}
            className="comment-form"
          >
            <label htmlFor="comment-text">
              Share your thoughts
            </label>

            <textarea
              id="comment-text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="3"
              maxLength={1000}
              placeholder="Write a comment..."
              required
            />

            {commentError && (
              <div className="error-message">{commentError}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={commentLoading}
            >
              {commentLoading ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <div className="login-notice">
            <p>You need to log in to comment.</p>
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          </div>
        )}

        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="empty-state">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((item) => (
              <article className="comment-card" key={item._id}>
                <div className="comment-avatar">
                  {(item.userId?.firstName || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="comment-content">
                  <div className="comment-header">
                    <strong>
                      {item.userId?.firstName || 'Unknown'}{' '}
                      {item.userId?.lastName || ''}
                    </strong>

                    <span>
                     {(item.dateTime || item.createdAt)
  ? new Date(item.dateTime || item.createdAt).toLocaleString()
  : ''}
                    </span>
                  </div>

                  <p>{item.comment}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

export default PhotoDetail
