# Fantasy Football Dynasty 🏆

A beautiful, dynamic web application to analyze your Yahoo Fantasy Football league's complete history. Track championships, win rates, head-to-head records, and visualize 20+ years of data.

![Dynasty Dashboard](https://via.placeholder.com/800x400/0a0e17/f5c542?text=Fantasy+Football+Dynasty)

## Features

- **🔐 Yahoo OAuth Integration** - Securely connect to your Yahoo Fantasy account
- **📊 Complete League History** - Fetch data from all seasons your league has existed
- **🏆 Dynasty Rankings** - See who dominates with championships, win %, and more
- **⚔️ Head-to-Head Matrix** - All-time records between every manager
- **📈 Performance Charts** - Visualize rankings, wins, and points over time
- **📅 Championship Timeline** - Celebrate every champion in league history

## Prerequisites

1. A Yahoo Fantasy Football account with league history
2. Node.js 18+ installed
3. A Yahoo Developer Application (see setup below)

## Setup

### 1. Create a Yahoo Developer Application

1. Go to [Yahoo Developer Network](https://developer.yahoo.com/apps/create/)
2. Sign in with your Yahoo account
3. Click "Create an App"
4. Fill in the application details:
   - **Application Name**: Fantasy Football Dynasty (or whatever you want)
   - **Application Type**: Web Application
   - **Redirect URI(s)**: 
     - For local development: `http://localhost:3000/api/auth/callback`
     - For production: `https://your-domain.vercel.app/api/auth/callback`
   - **API Permissions**: Check **Fantasy Sports** (Read only is fine)
5. Click "Create App"
6. Note your **Client ID** and **Client Secret**

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/fantasy-football-history.git
cd fantasy-football-history

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
YAHOO_CLIENT_ID=your_client_id_here
YAHOO_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/fantasy-football-history.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `YAHOO_CLIENT_ID`: Your Yahoo app client ID
   - `YAHOO_CLIENT_SECRET`: Your Yahoo app client secret
   - `NEXT_PUBLIC_APP_URL`: Your Vercel domain (e.g., `https://your-app.vercel.app`)
5. Click "Deploy"

### 3. Update Yahoo App Redirect URI

After deployment, go back to your Yahoo Developer Application and add your Vercel URL as a redirect URI:
```
https://your-app.vercel.app/api/auth/callback
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand
- **Authentication**: Yahoo OAuth 2.0

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts    # Initiates OAuth flow
│   │   │   ├── callback/route.ts # Handles OAuth callback
│   │   │   └── logout/route.ts   # Clears auth tokens
│   │   ├── leagues/route.ts      # Fetches user's leagues
│   │   └── season/route.ts       # Fetches season data
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home/login page
├── components/
│   ├── ChampionshipTimeline.tsx  # Timeline view
│   ├── HeadToHeadMatrix.tsx      # H2H matrix
│   ├── LeagueSelector.tsx        # League picker
│   ├── ManagerRankings.tsx       # Rankings table
│   ├── OverviewStats.tsx         # Summary stats
│   └── SeasonChart.tsx           # Line charts
└── lib/
    ├── store.ts                  # Zustand store
    └── yahoo.ts                  # Yahoo API client
```

## API Rate Limits

The Yahoo Fantasy Sports API has rate limits. This app includes:
- Small delays between API calls
- Token refresh handling
- Error handling for rate limit responses

For leagues with 20+ years of history, initial data loading may take 1-2 minutes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your own league!

## Acknowledgments

- [Yahoo Fantasy Sports API](https://developer.yahoo.com/fantasysports/guide/)
- [YFPY](https://github.com/uberfastman/yfpy) - Python wrapper that inspired some of the API handling
- Built with ❤️ for fantasy football enthusiasts everywhere
