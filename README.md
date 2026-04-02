# Fillux

**Fillux** is a profile management platform built with React, Tailwind CSS, and Firebase. It allows you to store your personal, academic, and document details once, so they can be securely accessed when filling out forms or applications.

---

## 🚀 Key Flow

1. **Landing Page** — Introduces the "Fillux" ecosystem.
2. **Authentication** — Sign in or create an account via Firebase Auth (Google Auth supported).
3. **Profile Setup (`Form.jsx`)** — Complete your profile including personal data, college details, and document uploads.
4. **Cloudinary Integration** — Resumes and Photo IDs are stored securely on Cloudinary.
5. **Dashboard (`Home.jsx`)** — Overview of your profile and links to the Chrome Extension.

---

## ✨ Features

- **Profile Storage** — Store your name, email, phone, college details, and more in **Firebase Firestore**.
- **Document Management** — Upload your Resume and College ID to **Cloudinary**.
- **Modern UI** — A premium, dark-themed interface built with **Tailwind CSS**.
- **Responsive Design** — Fully optimized for desktop and mobile.
- **Secure Auth** — Managed by **Firebase Authentication**.

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have **Node.js** installed on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fillux.git
cd fillux
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_apiKey
VITE_FIREBASE_AUTH_DOMAIN=your_authDomain
VITE_FIREBASE_PROJECT_ID=your_projectId
VITE_FIREBASE_STORAGE_BUCKET=your_storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messagingSenderId
VITE_FIREBASE_APP_ID=your_appId
VITE_FIREBASE_MEASUREMENT_ID=your_measurementId

# Cloudinary Config
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. Run the Project

```bash
npm run dev
```

Open your browser and visit `http://localhost:5173`

---

## 🏗️ Project Structure

```
fillux/
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # AuthContext to manage user state
│   ├── firebase/      # Firebase initialization & config
│   ├── pages/         # Main pages (Landing, Login, Home, Form)
│   ├── App.jsx        # Routing configuration
│   └── main.jsx       # Entry point
├── public/
├── index.html
└── vite.config.js
```

---

## 🤝 License

This project is licensed under the **MIT License**.

---

> Built to make your application process effortless.
