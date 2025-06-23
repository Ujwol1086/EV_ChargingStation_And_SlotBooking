# EVConnectNepal - EV Charging Station Detection and Slot Booking System

A full-stack application for locating and booking EV charging stations across Nepal.

## Tech Stack

- **Backend**: Flask with modular structure
- **Database**: MongoDB
- **Frontend**: Vite + React
- **Styling**: Tailwind CSS
- **Communication**: Axios

## Project Structure

```
EVConnectNepal/
├── backend/                 # Flask backend
│   ├── config/              # Configuration files
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT handling
│   │   └── database.py      # MongoDB connection
│   ├── models/              # Data models
│   │   ├── __init__.py
│   │   └── user.py          # User model
│   ├── routes/              # API routes
│   │   ├── __init__.py
│   │   └── auth_routes.py   # Authentication routes
│   ├── .env                 # Environment variables
│   ├── requirements.txt     # Python dependencies
│   └── server.py            # Main application entry
│
└── frontend/                # React frontend
    ├── public/              # Static assets
    ├── src/
    │   ├── api/             # API handling
    │   │   └── axios.js     # Axios configuration
    │   ├── components/      # Reusable components
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/         # Global state management
    │   │   ├── AuthContext.jsx
    │   │   ├── context.js
    │   │   └── useAuth.js
    │   ├── pages/           # Application pages
    │   │   ├── Dashboard.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── App.jsx          # Main component
    │   ├── index.css        # Global styles
    │   └── main.jsx         # Entry point
    ├── .env                 # Environment variables
    ├── package.json         # Dependencies
    └── vite.config.js       # Vite configuration
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Create a virtual environment and activate it:

   ```
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Make sure MongoDB is running locally or update the `.env` file with your MongoDB URI.

5. Run the server:
   ```
   python server.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## Features

- **User Authentication**: Register, login, and user profile management
- **EV Station Discovery**: Locate charging stations on a map (coming soon)
- **Slot Booking**: Reserve charging slots in advance (coming soon)
- **Dashboard**: Track and manage your bookings (coming soon)

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login an existing user
- `GET /api/auth/me`: Get current user information

## License

This project is licensed under the MIT License.
