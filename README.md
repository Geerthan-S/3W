# SocialPost App 🌐

A full-stack social feed application inspired by TaskPlanet's social page.  
Built with **React + Node.js + Express + MongoDB**.

---

## Project Structure

```
social-post-app/
├── frontend/        ← React (Vite) frontend
│   ├── src/
│   │   ├── pages/         (Feed, Login, Signup, Profile)
│   │   ├── components/    (Navbar, PostCard, CreatePost, CommentSection)
│   │   ├── services/      (api.js — all API calls)
│   │   └── context/       (AuthContext — JWT state)
│   └── .env               (VITE_API_URL)
│
└── backend/         ← Node.js + Express REST API
    ├── models/       (User.js, Post.js)
    ├── routes/       (authRoutes.js, postRoutes.js)
    ├── middleware/   (authMiddleware.js)
    ├── server.js
    └── .env          (MONGO_URI, JWT_SECRET, PORT)
```

---

## Features ✦

- **Account Creation** — Signup/login with email & password (JWT auth)
- **Create Post** — Text, image URL, or both (either field is optional)
- **Public Feed** — All posts from all users, newest first
- **Infinite Scroll** — Cursor-based pagination, loads more as you scroll
- **Like Toggle** — Like/unlike with instant optimistic UI updates
- **Comments** — Add comments, stored with username
- **User Profile** — View any user's posts + stats (posts, likes, comments)
- **Delete Own Post** — Authors can delete their own posts
- **Responsive** — Works on mobile, tablet, and desktop

---

## Tech Stack

| Layer     | Tech                        |
|-----------|-----------------------------|
| Frontend  | React 18 + Vite             |
| Styling   | Vanilla CSS (no Tailwind)   |
| Routing   | React Router v6             |
| HTTP      | Axios                       |
| Backend   | Node.js + Express           |
| Database  | MongoDB + Mongoose          |
| Auth      | JWT (jsonwebtoken + bcryptjs)|

---

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env   # Fill in MONGO_URI and JWT_SECRET
npm install
npm run dev            # Runs on http://localhost:5000
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/social-post-app
JWT_SECRET=your_secret_key_here
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev            # Runs on http://localhost:5173
```

Edit `frontend/.env` (if backend is on a different URL):
```env
VITE_API_URL=http://localhost:5000/api
```

---

## API Endpoints

| Method | Route                        | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| POST   | `/api/auth/register`         | ❌   | Register new user        |
| POST   | `/api/auth/login`            | ❌   | Login, returns JWT       |
| GET    | `/api/auth/me`               | ✅   | Get current user         |
| GET    | `/api/posts`                 | ❌   | Paginated feed           |
| POST   | `/api/posts`                 | ✅   | Create post              |
| POST   | `/api/posts/:id/like`        | ✅   | Toggle like              |
| POST   | `/api/posts/:id/comment`     | ✅   | Add comment              |
| DELETE | `/api/posts/:id`             | ✅   | Delete own post          |
| GET    | `/api/posts/user/:username`  | ❌   | Get posts by username    |

---

## Deployment

| Service   | Platform  |
|-----------|-----------|
| Frontend  | Vercel / Netlify |
| Backend   | Render    |
| Database  | MongoDB Atlas |

### Deploy to Vercel (Frontend)
1. Push to GitHub
2. Import repo at vercel.com
3. Set `VITE_API_URL` environment variable to your Render backend URL

### Deploy to Render (Backend)
1. Create a new Web Service on Render
2. Set start command: `npm start`
3. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`

---

## Bonus Features Implemented ✅

- ✅ **Cursor-based pagination** with Intersection Observer (true infinite scroll)
- ✅ **Skeleton loading** placeholders during feed fetch
- ✅ **Optimistic UI** for likes (instant, no waiting)
- ✅ **Responsive layout** (mobile-first, hamburger nav)
- ✅ **Code comments** throughout all files
- ✅ **Reusable components** (PostCard, CreatePost, CommentSection)
- ✅ **Clean modern UI** (dark mode, glassmorphism, gradient accents)
- ✅ **SEO meta tags** on index.html

---

Built for the 3W Full Stack Internship Assignment — Task 1 🚀
