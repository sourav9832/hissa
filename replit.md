# Hissa - Split Bills App

## Project Overview
A full-stack shared expense tracking application similar to Splitwise. Built with React, Node.js/Express, and PostgreSQL.

### Branding
- **Site Name**: Hissa
- **Tagline**: Kitna tera? Kitna mera? (Hindi: "How much is yours? How much is mine?")
- **Logo**: Blue geometric design (applogo_1772982443078.jpg)

## Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Google OAuth 2.0 (Passport.js)
- **Deployment Target**: AWS EC2 Ubuntu (not Replit paid deployment)

## Key Features Implemented

### 1. Group/Trip Management
- Create trips/groups with optional background images
- Image uploads stored as base64 in `groups.imageData`
- Dark overlay (40-50% black) ensures text readability over images
- Fallback colored backgrounds for groups without images
- **Edit Groups**: Users can edit trip name and change/add images via "Edit" button

### 2. Dashboard
- Displays trips in a horizontal card layout
- Group name, creation date, member count shown
- "**Manage**" button positioned on the right side (primary action)
- Dark overlay ensures text visibility

### 3. Expense Tracking
- Add expenses to groups with description and amount (in ₹ INR)
- Equal split among group members
- Receipt upload support (PDF/image drag-and-drop)
- Receipts stored as base64 in `receipts` table

### 4. Balance Tracking
- Real-time balance calculation (who owes whom)
- Display net balance for each user in INR
- Settlement tracking

### 5. Member Management
- Invite members via email, WhatsApp, or copy link
- Member join functionality
- Share group invite dialog

### 6. Google OAuth Integration
- User registration/login via Google account
- User data from Google profile (firstName, lastName, email, profileImageUrl)
- Session stored in PostgreSQL via connect-pg-simple

## Database Schema

### Tables
- **groups**: id, name, imageData (base64), createdAt
- **group_members**: id, groupId, userId, joinedAt
- **expenses**: id, groupId, paidByUserId, description, amount (in paise), createdAt
- **expense_splits**: id, expenseId, userId, amountOwed (in paise)
- **receipts**: id, expenseId, fileName, fileType, fileData (base64), uploadedAt
- **users**: Replit auth users table
- **sessions**: Replit auth sessions table

## API Endpoints

### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get group details (with members, expenses, balances)
- `PATCH /api/groups/:id` - Update group (name, image)
- `POST /api/groups/:id/join` - Join a group

### Expenses
- `POST /api/groups/:id/expenses` - Add expense to group
- `POST /api/expenses/:id/receipt` - Upload receipt

## Frontend Pages

### /
Landing page with hero section, features, and call-to-action

### /dashboard
Shows all user's trips/groups in expandable cards with:
- Group image or colored background
- Group name and creation date
- "Manage" button (primary action)
- Create new trip dialog

### /groups/:id
Group detail page with:
- Edit button (change name/image)
- Share invite dialog
- Add expense form
- Tabs for expenses and balances
- Member list

### /join/:token
Page to join groups via invite link

## UI Details

### Colors & Styling
- Dark overlay (bg-black/40 hover:bg-black/50) for image readability
- Default color palette: 8 rotating colors for groups without images
- White text on dark overlay for maximum contrast
- Rounded corners (3xl borders) on all major components

### Components
- **Navbar**: Logo, tagline, user profile dropdown
- **EditGroupDialog**: Modal to edit trip name and image
- **ShareDialog**: Share invite via email/WhatsApp/link
- **AddExpenseDialog**: Add expense with receipt upload
- **Form Components**: Using shadcn/ui with react-hook-form validation

## Environment Variables
- `SESSION_SECRET` - Session encryption secret
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 2.0 client secret

## File Structure
```
client/
  src/
    pages/
      Landing.tsx
      Dashboard.tsx
      GroupDetail.tsx
      JoinGroup.tsx
    components/
      EditGroupDialog.tsx      (NEW)
      AddExpenseDialog.tsx
      ShareDialog.tsx
      layout/
        Navbar.tsx
    hooks/
      use-groups.ts
      use-auth.ts
    lib/
      queryClient.ts

server/
  auth/
    googleAuth.ts          (Google OAuth 2.0)
    storage.ts             (User upsert/fetch)
    index.ts               (Auth exports)
  storage.ts
  routes.ts
  index.ts

shared/
  schema.ts
  routes.ts
  models/
    auth.ts
```

## Deployment to AWS EC2

1. SSH into EC2 instance
2. Clone repository and install deps: `npm install`
3. Push database schema: `npm run db:push`
4. Build frontend: `npm run build`
5. Start server with PM2: `pm2 start npm --name "hissa" -- run dev`
6. Configure nginx reverse proxy (port 80 → 5000)
7. Set up SSL certificate (Let's Encrypt)

## Todos / Future Features
- UPI payment integration (Razorpay/PhonePe)
- Expense categories
- Export expense reports (PDF/CSV)
- Dark mode toggle
- Mobile app
- Activity feed
