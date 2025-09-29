# Project Name: Payment System Solution Version 2

## Description
- This project started as a C++ version using Qt and CMake.  
- Curious about the web ecosystem, I built a JavaScript version to explore full-stack development on the web.  
- It demonstrates how a modern web application works with a React frontend and an Express backend, including RESTful API communication, responsive UI with Tailwind CSS, and iconography using Lucide React.


## Tech Stack

- **Frontend:** React, Tailwind CSS, Lucide React (icons)
- **Backend:** Node.js, Express
- **Middleware:** CORS, body-parser

## Features
- Responsive frontend design using Tailwind CSS
- Iconography using Lucide React
- RESTful API endpoints handled by Express
- CORS enabled for cross-origin requests
- JSON body parsing using body-parser
- Demonstrates full-stack communication between frontend and backend

## Installation (bash or zsh)

### 1. Clone the repository
- git clone https://github.com/your-username/your-repo.git
- cd your-repo

### 2. Setup Backend
- cd backend
- npm install
- npm run dev   # Starts backend server
- cd ..

### 3. Setup Frontend
- cd frontend
- npm install
- npm start     # Starts frontend dev server

### 4. Open in Browser
- Frontend: http://localhost:3000 (or your configured port) created in frontend/.env for example: REACT_APP_API_URL=http://localhost:3001/api
- Backend API: http://localhost:3001 (or your configured port) in backend/.env for example: PORT=3001 NODE_ENV=development

Folder Structure
root/
├─ backend/        # Express server, API routes
├─ frontend/       # React app, Tailwind CSS
├─ README.md



