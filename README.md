# Alzikrayat — MERN Edition

A full-stack photo-sharing web application built for the **Advanced Web Technologies** course (Project 3).
Users can register, log in, upload photos, browse a responsive gallery, open a photo detail page, comment on photos
and delete their own photos.

| Tier | Technology |
|---|---|
| Presentation | React (Vite), React Router, Axios, plain CSS |
| Application | Node.js, Express.js REST API, Joi validation, Multer uploads |
| Data | MongoDB (Atlas) with Mongoose schemas |

No meta-frameworks (Next.js, NestJS, Remix) and no SQL ODMs are used. Routes, controllers, middleware and
React components are hand-written.

## Features

- **Authentication:** register and login with `bcrypt` password hashing. The server never returns the password.
  After login, the user profile is kept in React state and `localStorage`.
- **Toolbar:** shows `Hi <firstName>` and a **Logout** button when logged in, and **Please Login** when logged out.
- **Home page:** banner, short description of Alzikrayat and navigation buttons.
- **Gallery:** photos are fetched with `useEffect` + Axios and shown in a responsive grid, with a **Grid / List** toggle.
- **Upload:** logged-in users upload an image (JPEG, PNG, GIF or WebP, max 5 MB) with a title and description.
  The file is stored in `server/uploads/` and its metadata in MongoDB.
- **Photo detail:** route `/photos/:id` (`useParams`) shows the full-size photo, metadata and comments.
- **Delete:** only the owner can delete a photo. Ownership is verified on the server, and both the database
  record and the file on disk are removed.
- **Comments:** any logged-in user can comment; the new comment appears immediately without a full page reload.
- **Validation and errors:** server-side Joi validation, Mongoose schema validation and a central error handler.
- **Responsive design:** layouts adapt to mobile, tablet and desktop screens.
- **Feedback states:** loading indicators and error messages on every page that talks to the API.

## Project structure

```text
Alzikrayat-MERN/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api/axios.js        # Axios instance (adds the token to requests)
│   │   ├── components/         # Navbar, PhotoCard, UploadForm
│   │   ├── context/            # AuthContext (login state)
│   │   ├── pages/              # Home, Gallery, PhotoDetail, Login, Register
│   │   ├── App.jsx             # React Router configuration
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   └── vite.config.js          # Dev proxy to the Express API
├── server/                     # Express backend
│   ├── config/                 # db.js (MongoDB connection), multer.js (upload settings)
│   ├── controllers/            # authController, photoController, commentController
│   ├── middleware/             # validation.js (Joi), authenticate.js, errorHandler.js
│   ├── models/                 # User.js, Photo.js, Comment.js (Mongoose schemas)
│   ├── routes/                 # authRoutes, photoRoutes, commentRoutes
│   ├── uploads/                # Stored image files (not committed)
│   ├── .env.example            # Example environment variables
│   └── server.js               # Express app entry point
├── .gitignore
└── README.md
```

## Requirements

- Node.js 18 or newer and npm
- A MongoDB Atlas cluster (free tier is enough) or a local MongoDB instance
- Git

## Setup and run locally

### 1. Get the code

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Alzikrayat-MERN
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env      # then edit .env with your own values
npm run dev               # or: npm start
```

The API runs at <http://localhost:5000>. You should see `MongoDB connected successfully!` in the terminal.

### 3. Frontend (in a second terminal)

```bash
cd client
npm install
npm run dev
```

The app runs at <http://localhost:5173>. Vite forwards `/api` and `/uploads` requests to the Express server
(see `client/vite.config.js`), so both servers must be running.

## Environment variables (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port of the Express server (default `5000`) |
| `MONGODB_URI` | MongoDB connection string, including the database name |
| `JWT_SECRET` | Secret used to sign the login token, which the server uses to identify the logged-in user |

The `.env` file is listed in `.gitignore` and must never be committed.

## REST API

All routes are prefixed with `/api`. Protected routes need the header `Authorization: Bearer <token>`,
which the React app adds automatically after login.

| Method | Endpoint | Auth | Description | Success status |
|---|---|---|---|---|
| GET | `/api/health` | No | API health check | 200 |
| POST | `/api/auth/register` | No | Register a new user | 201 |
| POST | `/api/auth/login` | No | Log in, returns token and public user profile | 200 |
| GET | `/api/photos` | No | List all photos | 200 |
| GET | `/api/photos/:id` | No | One photo with its comments | 200 |
| POST | `/api/photos` | Yes | Upload a photo (`multipart/form-data`: `photo`, `title`, `description`) | 201 |
| DELETE | `/api/photos/:id` | Yes (owner only) | Delete a photo, its comments and its file | 200 |
| POST | `/api/photos/:id/comments` | Yes | Add a comment (`{ "comment": "..." }`) | 201 |

Error status codes used: `400` validation error, `401` not logged in or invalid token, `403` not the owner,
`404` not found, `409` email already registered, `413` file too large, `500` server error.

## Database models (Mongoose)

- **User:** `firstName`, `lastName`, `email` (unique, validated), `password` (bcrypt hash), `location`, `description`, `occupation`
- **Photo:** `userId` (ref User), `fileName`, `title`, `description`, `dateTime`
- **Comment:** `photoId` (ref Photo), `userId` (ref User), `comment`, `dateTime`

## Security notes

- Passwords are hashed with bcrypt before saving and are removed from every JSON response.
- Secrets are read from `.env` and are never hardcoded.
- Input is validated with Joi on the server, and again by the Mongoose schemas.
- Uploads are limited to image types and 5 MB, and stored with random file names.
- Delete requests verify on the server that the logged-in user owns the photo.

## Troubleshooting

- **`MongoDB connection failed ... IP isn't whitelisted`:** in MongoDB Atlas open *Network Access* and add your
  current IP address (or `0.0.0.0/0` for development), then wait a minute and restart the server.
- **Register/login shows a network error:** make sure the backend is running on the port configured in `.env`
  and that the proxy in `client/vite.config.js` points to the same port.
- **Images do not load:** check that the file exists in `server/uploads/` and that the backend is running.

## Author

Alzikrayat MERN Project — Advanced Web Technologies, Sudan University of Science and Technology.

Submitted by: Anfal Abdelhamed Ali Ismaeil, Department: Software Engineering

---

## Project 4 (Bonus): Track D - Real-Time WebSocket (Socket.io)

**Rationale:** Comments are the most interactive part of Alzikrayat. Socket.io makes
them appear instantly for everyone viewing the same photo, without refreshing the page.

### How it works
- Server: Socket.io is attached to the Express HTTP server (`server/socket.js`).
- Each photo detail page joins a room named `photo:<photoId>`.
- After a comment is saved (`commentController.js`), the server emits `comment:new` to that room only.
- Client: `PhotoDetail.jsx` connects inside `useEffect`, listens for `comment:new`,
  and disconnects on unmount (cleanup).
- The Vite dev proxy forwards `/socket.io` (with WebSocket support) to the Express server.

### Setup
    cd server && npm install
    cd ../client && npm install

### Environment variables (server/.env, see server/.env.example)
    PORT=5000
    MONGODB_URI=<your MongoDB connection string>
    JWT_SECRET=<your secret>
    CLIENT_URL=http://localhost:5173

### Run the full stack
    cd server && npm run dev
    cd client && npm run dev     (open http://localhost:5173)

### Test the real-time feature
Open the same photo in two browsers (one normal, one incognito), post a comment in one,
and it appears instantly in the other.
