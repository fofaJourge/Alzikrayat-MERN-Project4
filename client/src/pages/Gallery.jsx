// Gallery page: fetches all photos from GET /api/photos (useEffect + Axios) and shows
// them in a responsive grid, with a Grid/List toggle as the alternate display style.
// Logged-in users also see the upload form.

import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios'
import PhotoCard from '../components/PhotoCard'
import UploadForm from '../components/UploadForm'
import { useAuth } from '../context/AuthContext'
import { createSocket } from '../socket'

function Gallery() {
  const { isAuthenticated } = useAuth()

  // photos: data from the API | loading/error: feedback states
  // refreshKey: changed after an upload to reload the list | viewMode: "grid" or "list"
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewMode, setViewMode] = useState('grid')

  // Load the photo list from the REST API
  const fetchPhotos = useCallback(async () => {
    try {
      setError('')
      const response = await api.get('/photos')
      setPhotos(response.data.photos || [])
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load photos.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // Run the fetch when the page opens and again whenever refreshKey changes
  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos, refreshKey])

  // Real-time gallery: when anyone uploads a photo, reload the list automatically
  useEffect(() => {
    const socket = createSocket()
    socket.on('photo:new', fetchPhotos)

    return () => {
      socket.off('photo:new', fetchPhotos)
      socket.disconnect()
    }
  }, [fetchPhotos])

  // Called by UploadForm after a successful upload: triggers a reload of the list
  const handleUploaded = () => {
    setRefreshKey((previous) => previous + 1)
  }

  return (
    <main className="page-container">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Explore memories</p>
          <h1>Photo Gallery</h1>
          <p className="page-subtitle">
            Discover beautiful moments shared by our community.
          </p>
        </div>
      </section>

      {isAuthenticated && (
        <UploadForm onUploaded={handleUploaded} />
      )}

      {loading && (
        <div className="status-message">Loading photos...</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="empty-state">
          <h2>No photos yet</h2>
          <p>Be the first to share a beautiful memory.</p>
        </div>
      )}

      {!loading && !error && photos.length > 0 && (
        <>
          <div className="gallery-toolbar">
            <p className="gallery-count">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>

            <div className="view-toggle" aria-label="Gallery display style">
              <button
                type="button"
                className={viewMode === 'grid' ? 'view-toggle-button active' : 'view-toggle-button'}
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
              >
                Grid
              </button>

              <button
                type="button"
                className={viewMode === 'list' ? 'view-toggle-button active' : 'view-toggle-button'}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
              >
                List
              </button>
            </div>
          </div>

          <section
            className={viewMode === 'grid' ? 'photo-grid' : 'photo-list'}
          >
            {photos.map((photo) => (
              <PhotoCard key={photo._id} photo={photo} />
            ))}
          </section>
        </>
      )}
    </main>
  )
}

export default Gallery
