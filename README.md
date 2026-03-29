# AutoFill Agent

**AutoFill Agent** is an AI-powered web automation tool that intelligently fills out online forms on your behalf. Simply provide a target URL and your profile details — the agent handles the rest.

---

## What It Does

AutoFill Agent uses an AI-driven backend to navigate to any web form, analyze its fields, and automatically fill them in using the profile data you provide. It simulates real user interaction, making form submission effortless and fast.

---

## Features

- **URL-based targeting** — Point the agent to any form on the web
- **AI-powered field detection** — Automatically identifies and maps form fields
- **Real-time status updates** — Watch the agent work step by step in the UI
- **Profile-based input** — Your data stays local and is sent only when you trigger the agent
- **One-click automation** — Fill and submit forms in seconds

---

## Project Structure

```
autofill-agent/
├── src/
│   ├── api/
│   │   └── agent.js          # API call to backend agent
│   ├── pages/
│   │   └── Home.jsx          # Main UI page
│   ├── components/           # Reusable UI components
│   ├── firebase/             # Firebase config (if used)
│   ├── App.jsx               # App routing
│   └── main.jsx              # Entry point
├── server/
│   ├── controllers/          # Request handlers
│   ├── routes/               # API routes
│   ├── services/             # Agent logic & automation
│   └── index.js              # Express server entry
├── public/
├── index.html
└── vite.config.js
```

---

## Getting Started

### Prerequisites

Make sure you have **Node.js** installed on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/autofill-agent.git
cd autofill-agent
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Run the Backend Server

```bash
cd server
node index.js
```

### 6. Run the Frontend

```bash
# In the root directory
npm run dev
```

Open your browser and visit `http://localhost:5173`

---

## How to Use

1. Enter the **URL** of the form you want to fill
2. Provide your **Name**, **Email**, and **Phone** in the profile fields
3. Click **Auto Fill Form**
4. Watch the real-time status updates as the agent works
5. Done! The form is filled and submitted automatically

---

## API Endpoint

The frontend communicates with the backend via:

```
POST http://localhost:5000/api/agent/run
```

**Request Body:**
```json
{
  "url": "https://example.com/form",
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  }
}
```

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

## Contributing

Pull requests are welcome! If you have ideas for new features or improvements, feel free to open an issue or submit a PR.

---

> Built to automate the boring stuff.
