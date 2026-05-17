# MediLink - Real-Time Ambulance to Doctor Demo

MediLink is a Node/Express website that uses Socket.IO for real-time updates between an ambulance/nurse page and a doctor dashboard.

## Run Locally

1. Install Node.js LTS from https://nodejs.org
2. Open a terminal in this folder
3. Install and start:

```bash
npm install
npm start
```

4. Open http://localhost:3000

## Website Routes

- Login: http://localhost:3000/login
- Nurse page: http://localhost:3000/nurse
- Doctor page: http://localhost:3000/doctor
- Health check: http://localhost:3000/health

## Login Credentials

| Role   | Username | Password  |
|--------|----------|-----------|
| Nurse  | nurse    | nurse123  |
| Doctor | doctor   | doctor123 |

## Demo Flow

1. Start the server.
2. Open the doctor dashboard and log in as Doctor.
3. Open the nurse page in another browser, tab, phone, or laptop using the same website URL.
4. Log in as Nurse, fill patient data, and transmit.
5. The doctor dashboard updates instantly through Socket.IO.

## Deploy As A Website

This app must be deployed to a Node.js host because it needs the Express server and Socket.IO. Static hosts such as GitHub Pages will not run the real-time backend.

Recommended settings for hosts such as Render, Railway, Fly.io, or a VPS:

- Build command: `npm install`
- Start command: `npm start`
- Node version: 18 or newer
- Port: use the host-provided `PORT` environment variable

GPS and map routing work best on HTTPS. Most hosting platforms provide HTTPS automatically.

## Important Notes

This is still a demo app. Login credentials, patient data, and doctor notes are not production-grade:

- Credentials are hardcoded in `server.js`.
- Patient data and notes are stored in memory and reset when the server restarts.
- Use a database, real authentication, audit logs, and privacy/security controls before handling real patient data.
