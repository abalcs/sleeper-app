# Sleeper Fantasy Insights App

A full-stack web app that integrates with the [Sleeper API](https://docs.sleeper.com) to provide rich fantasy football insights:
- League standings with sortable stats (Win%, PF, PA, etc.)
- Weekly matchups with collapsible **bench player** sections
- Position-by-position totals across teams, with toggle filtering
- Team-specific recommendations on trades to improve weak positions
- Modern UI with Tailwind styling, framer-motion animations, lazy loading, and mobile responsiveness

---

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS + framer-motion
- **Backend (optional):** Node/Express server (used when deployed to Heroku or Render)
- **API:** Sleeper’s public REST API (read-only, no auth required)
- **Deployment Options:**  
  - [Vercel](https://vercel.com) (recommended: frontend + optional serverless proxy)  
  - [Heroku](https://heroku.com) (Node server serves built React bundle)

---

## Project Structure

root/
client/ # React frontend
src/ # Components, hooks, styles
package.json
server.js # Express server (Heroku/Render deployments)
package.json # Root scripts/deps
Procfile # For Heroku
README.md

---

## Running Locally

### 1. Install dependencies
```bash
# Root server deps
npm install

# Client deps
cd client
npm install

# From /client
npm run dev    # Vite dev server on http://localhost:5173

# From root
npm run start  # Starts server.js on http://localhost:3000

Environment Variables

Not strictly required for Sleeper API (it’s public). If you add external APIs (e.g. OpenAI), set secrets in Vercel/Heroku dashboard:

OPENAI_API_KEY

NODE_ENV=production

Roadmap

 Add player search and trending data

 Add playoff bracket visualization

 Add persistent user settings (e.g., favorite team)

 Enhance trade recommendation engine

---

License

MIT © 2025
