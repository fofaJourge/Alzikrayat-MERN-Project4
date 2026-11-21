// App: sets up client-side routing with React Router (BrowserRouter, Routes, Route).
// The Navbar and footer stay on screen while the page in the middle changes.

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import UploadNotifier from './components/UploadNotifier'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import PhotoDetail from './pages/PhotoDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

// Routes: /photos/:id is the dynamic detail page (PhotoDetail reads :id with useParams).
// The "*" route catches unknown URLs and shows a 404 message.
function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <UploadNotifier />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/photos/:id" element={<PhotoDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="*"
            element={
              <main className="page-container">
                <div className="empty-state">
                  <h1>404 — Page Not Found</h1>
                  <p>The page you are looking for does not exist.</p>
                </div>
              </main>
            }
          />
        </Routes>

        <footer className="footer">
          <p>
            © {new Date().getFullYear()} Alzikrayat.
            Built with React, Node.js, Express, and MongoDB.
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
