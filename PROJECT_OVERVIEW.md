# Study Share Hub - Project Overview

## Project Summary
A study resource sharing platform built with **Lovable.dev** that allows students to upload, share, and download study notes and question papers. Features a points/rewards system to incentivize contributions.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + Vite 7 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | TanStack React Query |
| Routing | React Router DOM v6 |
| Forms | React Hook Form + Zod |
| Backend/Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Charts | Recharts |

---

## Project Structure

```
study-share-hub/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── AuthModal.tsx     # Login/signup modal
│   │   ├── BrowseNotes.tsx   # Browse approved notes
│   │   ├── BrowsePapers.tsx  # Browse approved papers
│   │   ├── FeedbackForm.tsx  # User feedback submission
│   │   ├── Header.tsx        # Navigation header
│   │   ├── Hero.tsx          # Landing page hero
│   │   ├── HowItWorks.tsx    # Feature explanation
│   │   ├── MyNotes.tsx       # User's uploaded notes
│   │   ├── MyUploads.tsx     # User's uploaded papers
│   │   ├── NoteUpload.tsx    # Note upload form
│   │   ├── PaperUpload.tsx   # Paper upload form
│   │   ├── PDFPreviewModal.tsx
│   │   ├── ProfileEditModal.tsx
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth state management
│   ├── hooks/
│   │   ├── use-mobile.tsx    # Responsive hook
│   │   ├── use-toast.ts      # Toast notifications
│   │   ├── useFileUpload.ts  # File upload logic
│   │   ├── useSignedUrl.ts   # Secure file URL generation
│   │   └── useTheme.ts       # Theme management
│   ├── integrations/
│   │   ├── lovable/          # Lovable.dev integration
│   │   └── supabase/
│   │       ├── client.ts     # Supabase client instance
│   │       └── types.ts      # Auto-generated DB types
│   ├── lib/                   # Utility functions
│   ├── pages/
│   │   ├── Index.tsx         # Landing page
│   │   ├── Dashboard.tsx     # User dashboard
│   │   ├── Papers.tsx        # Papers page
│   │   ├── Notes.tsx         # Notes page
│   │   ├── Admin.tsx         # Admin panel
│   │   ├── Catalog.tsx       # Resource catalog
│   │   ├── Rewards.tsx       # Points/rewards page
│   │   ├── HelpSupport.tsx   # Help & support
│   │   └── ResetPassword.tsx # Password reset
│   ├── test/                  # Test files
│   ├── App.tsx               # Main app with routes
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── supabase/
│   ├── functions/
│   │   └── get-signed-url/   # Edge function for secure downloads
│   ├── migrations/           # Database migrations (16 files)
│   └── config.toml           # Supabase config
├── .env                       # Environment variables
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## Database Schema (Supabase/PostgreSQL)

### Tables

#### 1. `profiles`
Stores user profile information (auto-created on signup via trigger).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users (unique) |
| name | TEXT | User's full name |
| mobile | TEXT | Mobile number |
| study_level | TEXT | Education level (nullable) |
| subjects_of_interest | TEXT[] | Array of subjects |
| career_goals | TEXT | Career goals (nullable) |
| points | INTEGER | Total reward points (default: 0) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**RLS Policies:** Users can only view/update their own profile.

---

#### 2. `papers`
Stores uploaded question papers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Uploader's user ID |
| title | TEXT | Paper title |
| description | TEXT | Description (nullable) |
| subject | TEXT | Subject name |
| level | TEXT | Education level |
| university | TEXT | University name (nullable) |
| year | INTEGER | Paper year (nullable) |
| file_path | TEXT | Storage path |
| file_size | INTEGER | File size in bytes |
| downloads | INTEGER | Download count (default: 0) |
| status | TEXT | 'pending' / 'approved' / 'rejected' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**RLS Policies:**
- Anyone can view approved papers
- Users can view/update/delete their own papers
- Admins can view/update all papers

---

#### 3. `notes`
Stores uploaded study notes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Uploader's user ID |
| title | TEXT | Note title |
| description | TEXT | Description (nullable) |
| subject | TEXT | Subject name |
| level | TEXT | Education level |
| chapter_topic | TEXT | Chapter/topic (nullable) |
| university | TEXT | University name (nullable) |
| file_path | TEXT | Storage path |
| file_size | INTEGER | File size in bytes |
| downloads | INTEGER | Download count (default: 0) |
| status | TEXT | 'pending' / 'approved' / 'rejected' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**RLS Policies:**
- Anyone can view approved notes
- Users can view/update/delete their own notes
- Admins can view/update all notes

---

#### 4. `points_history`
Tracks points earned/deducted for user actions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User's ID |
| points | INTEGER | Points (+/-) |
| action | TEXT | Action type (e.g., 'note_upload', 'paper_upload') |
| description | TEXT | Description (nullable) |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Point Values:**
- Paper upload: +20 points
- Note upload: +25 points
- Deletions: Points deducted

---

#### 5. `user_roles`
Role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| role | app_role | 'admin' / 'moderator' / 'user' |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Unique constraint:** (user_id, role)

---

#### 6. `feedback`
User feedback/suggestions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User's ID |
| category | TEXT | Feedback category |
| subject | TEXT | Subject line |
| message | TEXT | Feedback message |
| status | TEXT | 'pending' / 'reviewed' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

#### 7. `support_tickets`
Support ticket system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User's ID |
| subject | TEXT | Ticket subject |
| category | TEXT | Ticket category |
| description | TEXT | Issue description |
| status | TEXT | 'open' / 'closed' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

---

### Views

#### `notes_public`
A security-invoker view for approved notes that hides `user_id` for privacy.

---

### Database Functions

| Function | Description |
|----------|-------------|
| `has_role(user_id, role)` | Checks if user has specific role |
| `award_upload_points(user_id, action, description)` | Awards points for uploads (with duplicate prevention) |
| `deduct_upload_points_on_delete()` | Trigger function to deduct points on deletion |
| `increment_download_count(paper_id)` | Increments paper download counter |
| `increment_note_download_count(note_id)` | Increments note download counter |
| `get_user_email_by_mobile(mobile)` | Lookup email by mobile (for password recovery) |
| `update_updated_at_column()` | Auto-updates `updated_at` timestamps |
| `handle_new_user()` | Auto-creates profile on user signup |

---

### Triggers

| Trigger | Table | Description |
|---------|-------|-------------|
| `on_auth_user_created` | auth.users | Creates profile on signup |
| `update_profiles_updated_at` | profiles | Updates timestamp |
| `update_papers_updated_at` | papers | Updates timestamp |
| `update_notes_updated_at` | notes | Updates timestamp |
| `update_feedback_updated_at` | feedback | Updates timestamp |
| `update_support_tickets_updated_at` | support_tickets | Updates timestamp |

---

### Enums

```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
```

---

## Storage Buckets

| Bucket | Public | Description |
|--------|--------|-------------|
| papers | Yes | Stores question paper PDFs |
| notes | Yes | Stores study note PDFs |

**Storage Policies:**
- Anyone can view files
- Authenticated users can upload
- Users can only delete their own files

---

## Edge Functions

### `get-signed-url`
Generates secure signed URLs for file downloads.

**Features:**
- Validates item exists and matches file path
- Checks approval status (only approved items publicly accessible)
- Owners can access their own pending files
- Returns 1-hour expiring signed URL

---

## Authentication Flow

1. User signs up with email + password + metadata (name, mobile)
2. `on_auth_user_created` trigger auto-creates profile
3. Session persisted in localStorage
4. Auth state managed via `AuthContext`

---

## Key Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Index | Landing page |
| `/dashboard` | Dashboard | User dashboard |
| `/papers` | Papers | Upload/browse papers |
| `/notes` | Notes | Upload/browse notes |
| `/catalog` | Catalog | Resource catalog |
| `/rewards` | Rewards | Points & rewards |
| `/help` | HelpSupport | Help center |
| `/admin` | Admin | Admin panel (role-restricted) |
| `/reset-password` | ResetPassword | Password reset |

---

## Environment Variables

```env
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
```

---

## Migration History (16 migrations)

1. `20260120083242` - Create profiles table, RLS, triggers
2. `20260120084312` - Create papers table, points, storage bucket
3. `20260121160933` - Add download count function for papers
4. `20260121161250` - Create user_roles, app_role enum, has_role function
5. `20260122175034` - Add get_user_email_by_mobile function
6. `20260123105914` - Create support_tickets table
7. `20260127171325` - Create notes table, storage bucket
8. `20260128102326` - Create feedback table
9. `20260131081939` - Create notes_public view
10. `20260131082229` - Secure points function, fix SQL injection
11. `20260131082754` - Additional security fixes
12. `20260201134019` - (unknown - need to check)
13. `20260203060537` - (unknown - need to check)
14. `20260203060936` - (unknown - need to check)
15. `20260203061026` - (unknown - need to check)
16. `20260210055354` - Update point values (20 for papers, 25 for notes)

---

## Security Features

- Row Level Security (RLS) on all tables
- SECURITY DEFINER functions for sensitive operations
- Input sanitization (e.g., mobile number validation)
- Signed URLs for secure file downloads
- Role-based access control (admin/moderator/user)
- Points fraud prevention (duplicate upload checks)
