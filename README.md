# Email Security and Spam Pattern Detection System

Full-stack academic project based on problem statement 42.

## Stack
- React + Vite frontend
- Node.js + Express backend
- Regular expressions for email and spam-pattern checks
- Finite-state machine (FSM) for SAFE / SUSPICIOUS / SPAM classification

## Run locally
Requirements: Node.js 18+

Terminal 1:
```bash
cd backend
npm install
npm run dev
```
Backend: http://localhost:4000
Health: http://localhost:4000/api/health

Terminal 2:
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## Deployment
### Render backend
Root Directory: `backend`
Build Command: `npm install`
Start Command: `npm start`
Set `CLIENT_ORIGIN` to the exact Vercel frontend origin.

### Vercel frontend
Root Directory: `frontend`
Framework: Vite
Install Command: `npm install`
Build Command: `npm run build`
Output Directory: `dist`
Set `VITE_API_URL` to the Render backend base URL (no trailing slash).

## API
- GET `/` API status
- GET `/api/health` health check
- POST `/api/emails/analyze` analyze email; JSON body: `{ "sender":"...", "subject":"...", "message":"..." }`
- GET `/api/emails` analysis history
- GET `/api/dashboard` summary counts
- GET `/api/alerts` security alerts

History is stored in memory and resets when the backend restarts. This is a rule-based educational demo, not a production mail security gateway. Use sample emails, not private messages.
