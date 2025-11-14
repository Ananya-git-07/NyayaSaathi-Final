# ⚖️ NyayaSaathi: AI-Powered Legal Assistant

**NyayaSaathi (न्यायसाथी)** is a full-stack web application designed to bridge the justice gap in rural India. It acts as an AI-powered digital companion ("Saathi") that simplifies complex legal and administrative processes ("Nyaya") through natural conversation, making justice accessible to everyone, regardless of legal knowledge or digital literacy.

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [⚙️ Environment Variables](#️-environment-variables)
- [📁 Project Structure](#-project-structure)
- [🌐 API Endpoints](#-api-endpoints)

---

## 🎯 The Problem

For nearly 900 million Indians in rural areas, accessing essential legal and government services is a significant challenge. The system is often plagued by:

-   **Complex Jargon:** Legal documents and government forms are filled with intimidating language.
-   **Digital Divide:** Low digital literacy creates a barrier to accessing online services.
-   **Inaccessibility:** Physical distance to courts and administrative offices, coupled with high costs, puts reliable legal aid out of reach.

This results in missed deadlines, exploitation by middlemen, and a denial of rightful benefits and justice.

## 💡 Our Solution

NyayaSaathi tackles these challenges head-on by translating complex paperwork into simple, voice-driven conversations. Our platform empowers users to:

-   **Understand their Rights:** Get clear, actionable information about common legal issues.
-   **Manage their Cases:** Report issues, upload documents, and track progress through a simple dashboard.
-   **Interact Naturally:** Use voice commands in English, Hindi, or Hinglish to interact with the AI and fill out forms.

Our mission is to ensure that no one is left behind due to the complexities of the legal system.

---

## ✨ Key Features

-   **🤖 AI Legal Assistant:** Powered by Google's Gemini API, the assistant provides empathetic, action-oriented guidance. It features a hardened prompt for strict **language parity**, responding in the user's exact language (English, Hindi, Hinglish).
-   **🗣️ Voice Command Integration:** Utilizes the Web Speech API to allow users to fill forms and issue commands with their voice, enhancing accessibility.
-   **👤 Role-Based Access Control (RBAC):** A robust system with four distinct user roles:
    -   **Citizen:** The primary user of the platform.
    -   **Employee:** Kiosk-level staff who assist citizens.
    -   **Paralegal:** Legal professionals for issue escalation.
    -   **Admin:** Oversees the entire system with a comprehensive dashboard.
-   **📂 Issue & Document Management:** Securely create legal issues, upload related documents via Cloudinary, and track the entire case history through a timeline view.
-   **🏢 Kiosk-Based Model:** Built to support a network of physical or organizational kiosks (e.g., NALSA, DLSA, NGOs) for on-the-ground support.
-   **📊 Comprehensive Admin Panel:** Admins have a dashboard with key metrics, data visualizations, and full CRUD capabilities for all data models.
-   **🌐 Full Internationalization (i18n):** Complete bilingual support for English and Hindi across the entire user interface.
-   **🔐 Secure Authentication:** Implemented with JWT (Access & Refresh Tokens), secure cookies, and a resilient, centralized error-handling system.

---

## 🛠️ Tech Stack

### Frontend

| Technology       | Description                              |
| ---------------- | ---------------------------------------- |
| **React**        | A JavaScript library for building UIs    |
| **Vite**         | Next-generation frontend tooling         |
| **Tailwind CSS** | A utility-first CSS framework            |
| **React Router** | Declarative routing for React apps       |
| **Axios**        | Promise-based HTTP client                |
| **i18next**      | Internationalization framework           |
| **Framer Motion**| Animation library for React              |
| **React Hot Toast**| Notification library                     |

### Backend

| Technology            | Description                                |
| --------------------- | ------------------------------------------ |
| **Node.js**           | JavaScript runtime environment             |
| **Express.js**        | Web application framework for Node.js      |
| **MongoDB**           | NoSQL database                             |
| **Mongoose**          | Object Data Modeling (ODM) library         |
| **JSON Web Token (JWT)**| Secure authentication tokens               |
| **Bcrypt.js**         | Password hashing                           |
| **Cloudinary**        | Cloud-based image and video management     |
| **Multer**            | Middleware for handling `multipart/form-data` |
| **Google Gemini API** | AI model for the legal assistant           |
| **Dotenv**            | Manages environment variables              |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   **Node.js** (v18.x or higher)
-   **npm** or **yarn**
-   **MongoDB:** A running instance (local or a cloud service like MongoDB Atlas).

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Ananya-git-07/NyayaSaathi-Final.git
    cd NyayaSaathi-Final
    ```

2.  **Setup the Backend:**
    ```sh
    cd Backend
    npm install
    ```
    -   Create a `.env` file in the `/Backend` directory.
    -   Copy the contents of the `Backend/.env.example` section below into it and fill in your values.
    -   Start the backend server:
    ```sh
    npm run dev
    ```

3.  **Setup the Frontend:**
    -   Open a new terminal window.
    ```sh
    cd Frontend
    npm install
    ```
    -   Create a `.env` file in the `/Frontend` directory.
    -   Copy the contents of the `Frontend/.env.example` section below into it.
    -   Start the frontend development server:
    ```sh
    npm run dev
    ```

4.  **Access the application:**
    Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

---

## ⚙️ Environment Variables

For the application to run correctly, you must create `.env` files in both the `Frontend` and `Backend` directories.

#### `Backend/.env.example`
```env
# Server Configuration
PORT=5001
NODE_ENV=development # 'production' or 'development'

# MongoDB Connection String
MONGO_URL="your_mongodb_connection_string"

# CORS Origins (comma-separated list of allowed frontend URLs)
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"

# JWT Secrets (use strong, random strings)
ACCESS_TOKEN_SECRET="your_strong_access_token_secret"
REFRESH_TOKEN_SECRET="your_strong_refresh_token_secret"

# Google Gemini AI API Key
GEMINI_API_KEY="your_google_gemini_api_key"

# Cloudinary Credentials for file uploads
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

#### `Frontend/.env.example`
```env
# The base URL of your backend API
VITE_API_URL="http://localhost:5001/api"
```

---

## 📁 Project Structure

The project is organized into a standard monorepo structure with separate `Frontend` and `Backend` directories.

```
nyayasaathi/
├── Backend/
│   ├── src/
│   │   ├── config/       # Database connection
│   │   ├── controllers/  # Application logic
│   │   ├── middleware/   # Express middleware (auth, error handling)
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   └── utils/        # Utility functions (asyncHandler, Cloudinary)
│   └── server.js         # Main server entry point
│
└── Frontend/
    └── src/
        ├── api/          # Axios configuration and services
        ├── assets/       # Static assets (images, logos)
        ├── components/   # Reusable React components
        ├── context/      # React Context (AuthContext)
        ├── locales/      # i18n translation files (en, hi)
        ├── pages/        # Page-level components
        ├── services/     # Business logic services (AI service)
        ├── App.jsx       # Main application component with routing
        └── main.jsx      # Frontend entry point
```

---

## 🌐 API Endpoints

The backend exposes a RESTful API with the following primary routes under the `/api` prefix:

-   `/api/auth`: User registration, login, logout, token refresh.
-   `/api/users`: User profile management.
-   `/api/issues`: CRUD operations for legal issues.
-   `/api/documents`: Document upload and management.
-   `/api/kiosks`: Public and private endpoints for kiosk data.
-   `/api/ai/chat`: Endpoint for interacting with the Gemini AI assistant.
-   `/api/admins`: Routes for the admin panel, including statistics.
-   _(and more for employees, paralegals, etc.)_
