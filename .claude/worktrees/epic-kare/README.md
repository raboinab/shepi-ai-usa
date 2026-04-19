# Shepi AI - Quality of Earnings Analysis Platform

## Project Overview

Shepi AI is a comprehensive Quality of Earnings (QoE) analysis platform built for M&A professionals. The platform integrates with QuickBooks, processes financial documents, and generates detailed analysis spreadsheets.

## Architecture

- **Frontend**: React + TypeScript with Vite
- **Backend**: Supabase (Database + Edge Functions)
- **Sheets Service**: Google Sheets integration via shepiSheets API
- **Deployment**: Lovable Cloud

### Key Features

- ✅ User authentication and role-based access
- ✅ Project management and wizard workflows
- ✅ Document upload and processing
- ✅ QuickBooks integration
- ✅ Google Sheets generation and sync
- ✅ AI-powered insights and chat
- ✅ Stripe payment integration
- ✅ Admin dashboard

## Setup

### Prerequisites

- Bun 1.3.4+ ([install Bun](https://bun.sh/docs/installation))
- Supabase account
- Google Cloud project (for Sheets API)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd shepi-ai-web

# Copy environment variables
cp .env.example .env

# Install dependencies
bun install

# Start development server
bun run dev
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_PROJECT_ID="sqwohcvobfnymsbzlfqr"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://sqwohcvobfnymsbzlfqr.supabase.co"
```

## Technology Stack

- **Frontend**: 
  - React 19.2.1
  - TypeScript
  - Vite 7.2.7
  - TanStack Query
  - shadcn-ui
  - Tailwind CSS
  
- **Backend**:
  - Supabase (PostgreSQL + Edge Functions)
  - Google Sheets API
  - Stripe
  - QuickBooks API

## Deployment

This project is deployed on Lovable Cloud. Changes pushed to the repository are automatically deployed.

### Manual Deployment

```sh
# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
src/
├── components/        # React components
│   ├── admin/        # Admin dashboard components
│   ├── insights/     # Analytics and insights
│   ├── ui/           # shadcn-ui components
│   ├── wizard/       # Project wizard components
│   └── workflow/     # Workflow status components
├── hooks/            # Custom React hooks
├── integrations/     # External integrations
│   └── supabase/     # Supabase client and types
├── lib/              # Utility functions
├── pages/            # Page components
└── types/            # TypeScript type definitions

supabase/
├── functions/        # Edge Functions
└── migrations/       # Database migrations
```

## Database

The project uses Supabase PostgreSQL with the following main tables:

- `profiles` - User profiles
- `projects` - QoE analysis projects
- `documents` - Uploaded documents
- `workflows` - Background job tracking
- `subscriptions` - Stripe subscriptions
- `company_info` - QuickBooks connections

## Edge Functions

- `create-project-sheet` - Creates Google Sheets for projects
- `sync-sheet` - Syncs data between app and sheets
- `insights-chat` - AI-powered chat assistant
- `check-subscription` - Validates user subscriptions
- `stripe-webhook` - Handles Stripe events
- And 8 more...

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `bun run dev`
4. Commit and push to trigger deployment

## Support

For issues or questions, contact the development team.

---

Built with ❤️ by QoFE AI
