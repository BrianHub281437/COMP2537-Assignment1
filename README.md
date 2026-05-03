# COMP 2537 - Assignment 1

A Node.js/Express web application with user authentication, session management, and MongoDB integration.

## Features

1. Home page with conditional navigation (signup/login vs members/signout)
2. Signup page with name, email, and password fields
3. Login page with email and password fields
4. Members-only page displaying 1 of 3 random images
5. Session-based authentication with 1-hour expiry
6. BCrypt password hashing (10 salt rounds)
7. Joi schema validation on all user input
8. Encrypted MongoDB session storage via connect-mongo
9. Custom 404 error page with proper status code
10. All secrets stored in `.env` (excluded from git)

## Prerequisites

- Node.js (v18+)
- MongoDB Atlas cluster (or local MongoDB)
- npm

## Installation

```bash
git clone <your-repo-url>
cd COMP2537-Assignment1
npm install
```

Copy `sample.env` to `.env` and fill in your values:

```
MONGODB_HOST=your-cluster.mongodb.net
MONGODB_USER=your-username
MONGODB_PASSWORD=your-password
MONGODB_USER_DATABASE=your-users-database
MONGODB_SESSION_DATABASE=your-sessions-database
MONGODB_SESSION_SECRET=your-session-encryption-secret
NODE_SESSION_SECRET=your-node-session-secret
PORT=3000
```

Start the server:

```bash
node server.js
```

## Directory Structure

```
COMP2537-Assignment1/
├── server.js                 # Main Express application
├── databaseConnection.js     # MongoDB client setup
├── utils.js                  # Global path/include helpers
├── sample.env                # .env template (copy to .env and fill in values)
├── .env                      # Environment variables (not in git)
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
├── SELF_GRADED_CHECKLIST.txt # Grading checklist
├── public/
│   ├── style.css             # Global styles
│   ├── image1.jpg            # Member image 1
│   ├── image2.jpg            # Member image 2
│   └── image3.jpg            # Member image 3
└── views/
    ├── home.ejs              # Home page template
    ├── signup.ejs            # Signup form
    ├── signupError.ejs       # Signup error display
    ├── login.ejs             # Login form
    ├── loginError.ejs        # Login error display
    ├── members.ejs           # Members area
    └── 404.ejs               # 404 error page
```

## Key Implementation Details

- **Password Security**: Passwords are hashed using BCrypt with 12 salt rounds before storing in MongoDB.
- **Input Validation**: All user input is validated server-side using Joi schemas to prevent injection attacks.
- **NoSQL Injection**: `express-mongo-sanitize` strips `$` operators from user input before it reaches MongoDB.
- **Session Storage**: Sessions are stored in a separate MongoDB database with encryption via `connect-mongo`'s crypto option.
- **Session Expiry**: Sessions automatically expire after 1 hour (`maxAge: 3600000ms`).
- **Cookie Security**: Cookies are set with `httpOnly: true` to prevent client-side JavaScript access.
- **Module Structure**: `utils.js` provides a global `include()` helper; `databaseConnection.js` owns the MongoDB client.

## Database Schema

### Users Collection

| Field    | Type   | Description              |
|----------|--------|--------------------------|
| name     | String | User's display name      |
| email    | String | User's email (login key) |
| password | String | BCrypt hashed password   |

### Sessions Collection

Managed automatically by `connect-mongo`. Stores encrypted session data with TTL-based expiry.

## Deployment (Render)

1. Push code to GitHub (ensure `.env` is in `.gitignore`)
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repository
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add all `.env` variables in the Render Environment settings
7. Deploy

## Testing Checklist

- [ ] Home page shows signup/login links when not logged in
- [ ] Home page shows members/signout links when logged in
- [ ] Signup creates a user and redirects to /members
- [ ] Signup validates missing/invalid fields
- [ ] Login authenticates and redirects to /members
- [ ] Login rejects invalid credentials
- [ ] Members page shows random image and greeting
- [ ] Members page redirects to / if not logged in
- [ ] Logout destroys session and redirects to /
- [ ] Invalid URLs show 404 page with correct status code
- [ ] Passwords are hashed in the database
- [ ] Sessions expire after 1 hour
