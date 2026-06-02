# Pitch Booking Platform

A modern Next.js application for booking sports pitches with integrated M-Pesa payments and real-time features.

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Building for Production
```bash
npm run build
npm run start
```

### Type Checking
```bash
npm run typecheck
```

## 📦 Technology Stack

- **Frontend**: Next.js 16+ with React 19
- **Styling**: Tailwind CSS with custom themes
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Payments**: M-Pesa integration via Supabase functions
- **UI Components**: Lucide React icons, Sonner toasts
- **Language**: TypeScript with strict mode

## 📁 Project Structure

```
app/                  # Next.js app router pages
├── page.tsx          # Landing page
├── booking/          # Pitch booking interface
├── checkout/         # Payment checkout
├── coaches/          # Coaches listing
├── venues/           # Venue details
└── ...

components/           # Reusable React components
├── CheckoutWizard    # Payment flow
├── BookingCalendar   # Availability selector
├── Canvas3D*         # 3D visualizations
└── ...

lib/                  # Utilities and services
├── supabase/         # Supabase client setup
├── mockData.ts       # Demo data
└── booking/          # Booking logic

types/                # TypeScript type definitions
hooks/                # Custom React hooks
supabase/             # Database schema & functions
```

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 Deployment

See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Netlify
1. Push to GitHub
2. Connect repo to Netlify
3. Add environment variables
4. Deploy!

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## 🎯 Features

- 📅 Real-time pitch availability
- 💳 M-Pesa payment integration
- 👥 Coach and venue listings
- 🎨 Modern dark/light theme support
- 📱 Responsive mobile design
- 🔐 Secure Supabase authentication
- ⚡ Optimized performance with static generation

## 📄 License

Private project

---

**Ready to deploy?** See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)
