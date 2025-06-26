# CharterOps - Trip Disruption Management Dashboard

A real-time operations dashboard for Part 135 charter operators to proactively manage trip disruptions including weather delays, crew duty violations, airport curfews, and mechanical issues.

## Features

- **Live Flight Operations Dashboard** - Real-time view of active and upcoming flights with color-coded status indicators
- **Real-Time Disruption Alerts** - Automatic alerts for weather, crew duty conflicts, mechanical issues, and airport problems
- **Crew Duty Tracker** - Monitor crew duty hours and FAA Part 135 rest compliance
- **Backup Plan System** - Assign and activate backup crew, aircraft, or alternate airports
- **Passenger Communication Panel** - Send templated messages to passengers with real-time updates
- **Disruption Report Generator** - Generate downloadable reports for post-trip analysis

## Tech Stack

- **Frontend**: React + Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **External APIs**: OpenSky, AviationWeather.gov, FAA NOTAM feeds (planned)
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Python 3.8+ (for virtual environment)
- Supabase account

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd charterops

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run setup script (creates .env.local and installs dependencies)
./setup.sh
```

### 2. Manual Setup (Alternative)

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local  # if .env.example exists
# Or manually create .env.local with:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy the SQL schema from `supabase-schema.sql` and run it in the Supabase SQL editor
4. Update `.env.local` with your actual Supabase credentials

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Troubleshooting

### Common Errors and Solutions

#### Error 1: "supabaseUrl is required"
**Solution**: Ensure your `.env.local` file contains valid Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Error 2: Build fails during prerendering
**Solution**: The app is configured to handle this automatically. If issues persist, ensure:
- Environment variables are properly set
- Supabase project is accessible
- Database schema is properly configured

#### Error 3: TypeScript path resolution errors
**Solution**: The project uses Next.js 14 with proper path mapping. If you see import errors:
- Ensure you're using the `@/` prefix for imports from `src/`
- Check that `tsconfig.json` path mapping is correct
- Restart the development server

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Database Schema

### Core Tables

- **users** - User profiles and roles (dispatcher, pilot, ops_manager)
- **flights** - Flight information with status tracking
- **crew** - Crew members with duty hour tracking
- **alerts** - Real-time disruption alerts
- **messages** - Passenger communication logs
- **backups** - Backup plans for flights

### Key Features

- **Row Level Security (RLS)** - Data access controlled by user authentication
- **Real-time subscriptions** - Live updates for alerts and flight status changes
- **Automatic user creation** - New auth users automatically get profiles

## API Endpoints

- `GET /api/flights` - Retrieve flights with optional filtering
- `POST /api/flights` - Create new flight
- `POST /api/alerts` - Create new alert
- `GET /api/crew/:id` - Get crew member details
- `PATCH /api/crew/:id/duty` - Update crew duty hours
- `POST /api/flights/:id/activate-backup` - Activate backup plan
- `POST /api/messages` - Send passenger message
- `GET /api/reports/:flight_id` - Generate disruption report

## Components

- **FlightCard** - Individual flight display with status indicators
- **AlertPanel** - Real-time alert management
- **CrewDutyTracker** - Crew duty hour monitoring
- **BackupPlanModal** - Backup plan creation and activation
- **MessagePanel** - Passenger communication interface

## Authentication

The app uses Supabase Auth with email/password authentication. Users are automatically assigned the 'dispatcher' role upon signup.

## Real-time Features

- Live flight status updates
- Instant alert notifications
- Real-time crew duty tracking
- Live backup plan status

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Supabase)

- Database and authentication are handled by Supabase
- Edge functions can be deployed for additional serverless functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Note**: This is a demonstration project. For production use, additional security measures, error handling, and testing should be implemented.
