## Project Summary
Qidzo is a playful and bubbly social learning platform designed for kids aged 4-17. It combines the engagement of Instagram and Snapchat with the educational value of Duolingo and Khan Academy Kids, creating a safe, gamified environment for sharing and learning.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Fonts**: Nunito (Headings), Poppins (Accents), Inter (Body)
- **Deployment**: Turbopack enabled

## Architecture
- `src/app/`: Page routes and layouts
- `src/components/`: Reusable UI components (Navbar, Sidebar, PostCard, etc.)
- `public/`: Static assets

## User Preferences
- **Theme**: Playful, bubbly, and colorful (Duolingo/Snapchat inspired)
- **Colors**: Brand Purple (#8B5CF6), Hot Pink (#EC4899), Sky Blue (#0EA5E9), Sunshine Yellow (#FBBF24), Grass Green (#10B981)
- **UI Elements**: Rounded corners (min 16px), gradients, soft shadows, and heavy emoji usage.

## Project Guidelines
- Mobile-first design approach.
- Maintain a 3-column layout on desktop.
- Focus on gamification elements (XP, badges, levels).
- Ensure all components are kid-appropriate and visually engaging.

## Common Patterns
- Reusable `PostCard` for feed content.
- Sticky navigation and category bars for easy access.
- Sidebars for desktop-only widgets (Challenges, Leaderboards).
