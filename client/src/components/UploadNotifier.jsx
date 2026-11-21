// UploadNotifier: shows a small toast in the corner when ANOTHER user uploads a photo.
// It listens for the "photo:new" Socket.io event that the server broadcasts to every
// connected client (io.emit) after a successful upload. Toasts disappear after 6 seconds.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createSocket } from '../socket'
import { useAuth } from '../context/AuthContext'
import './UploadNotifier.css'

const TOAST_DURATION_MS = 6000

function UploadNotifier() {
  const { user } = useAuth()
  const currentUserId = user?._id || user?.id

  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const socket = createSocket()
    const timers = []

    const handleNewPhoto = (photo) => {
      const uploaderId = photo.userId?._id || photo.userId

      // Do not notify users about their own uploads
      if (currentUserId && String(uploaderId) === String(currentUserId)) return

      setToasts((prev) =>
        prev.some((t) => t._id === photo._id) ? prev : [...prev, photo]
      )

      // Auto-dismiss after a few seconds
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t._id !== photo._id))
      }, TOAST_DURATION_MS)
      timers.push(timer)
    }

    socket.on('photo:new', handleNewPhoto)

    // Cleanup: stop listening, close the connection and clear pending timers
    return () => {
      socket.off('photo:new', handleNewPhoto)
      socket.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [currentUserId])

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t._id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((photo) => (
        <div className="toast" key={photo._id}>
          <div className="toast-text">
            <strong>
              {photo.userId?.firstName || 'Someone'} uploaded a new photo
            </strong>
            <span>{photo.title}</span>
            <Link to={`/photos/${photo._id}`} onClick={() => dismiss(photo._id)}>
              View photo
            </Link>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => dismiss(photo._id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default UploadNotifier
