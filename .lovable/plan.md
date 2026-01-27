

# Subject Notes Feature - Implementation Plan

## Overview
Add a new "Subject Notes" feature that allows students to upload, share, and search for study notes organized by subject. This will work alongside the existing Papers Library and help students find subject-specific study materials.

---

## What Will Be Built

### 1. New Notes Library Page
A dedicated `/notes` page where students can:
- Browse all approved notes from other students
- Search notes by title, description, or keywords
- Filter notes by **Subject** (the primary filter for notes)
- Filter notes by **Level** (10th, +1, +2, Undergraduate, etc.)
- View and download notes

### 2. Notes Upload Feature
Students can upload their subject notes:
- PDF files up to 10MB
- Required: Title, Subject, Level
- Optional: Description, Chapter/Topic, School/University
- Earn points for each approved upload

### 3. My Notes Section
Students can manage their uploaded notes:
- View upload status (Pending, Approved, Rejected)
- Delete their own notes
- Track download counts

---

## User Experience Flow

```
Student logs in
      |
      v
+------------------+
|    Dashboard     |
|  (Quick Actions) |
+------------------+
      |
      v
+------------------+       +------------------+
|  Papers Library  | <---> |   Notes Library  |
|   (Question      |       |  (Subject Notes) |
|    Papers)       |       +------------------+
+------------------+              |
                                  v
                         +------------------+
                         | Browse Notes     |
                         | - Search         |
                         | - Filter Subject |
                         | - Filter Level   |
                         +------------------+
                                  |
                                  v
                         +------------------+
                         | Upload Notes     |
                         | - Select Subject |
                         | - Add Details    |
                         | - Earn Points    |
                         +------------------+
```

---

## Technical Details

### Database Changes

**New Table: `notes`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth user |
| title | text | Note title |
| description | text | Optional description |
| subject | text | Subject name (required) |
| level | text | Academic level |
| chapter_topic | text | Optional chapter/topic |
| university | text | Optional school/university |
| file_path | text | Storage path |
| file_size | integer | File size in bytes |
| downloads | integer | Download count |
| status | text | pending/approved/rejected |
| created_at | timestamp | Upload timestamp |
| updated_at | timestamp | Last update |

**Row-Level Security (RLS) Policies:**
- Users can upload their own notes
- Users can view their own notes (any status)
- Users can delete their own notes
- Everyone can view approved notes
- Admins can view and update all notes

**Storage Bucket:**
- Create `notes` storage bucket (similar to `papers`)
- Public read access for approved files
- Authenticated upload/delete

### New Files to Create

1. **`src/pages/Notes.tsx`** - Main notes library page with tabs
2. **`src/components/BrowseNotes.tsx`** - Browse and search notes
3. **`src/components/NoteUpload.tsx`** - Upload modal for notes
4. **`src/components/MyNotes.tsx`** - Manage uploaded notes

### Files to Modify

1. **`src/App.tsx`** - Add `/notes` route
2. **`src/components/Header.tsx`** - Add "Browse Notes" navigation link
3. **`src/pages/Dashboard.tsx`** - Add quick action card for Notes
4. **`src/pages/Admin.tsx`** - Add Notes management tab for admins

### Subject List
The subject filter will include these options:
- Mathematics
- Physics
- Chemistry
- Biology
- Computer Science
- English
- History
- Geography
- Economics
- Business Studies
- Psychology
- Law
- Medicine
- Engineering
- Other

---

## Implementation Steps

### Step 1: Database Setup
Create the `notes` table with proper columns and RLS policies. Add a storage bucket for notes files. Create a database function to increment download counts.

### Step 2: Notes Page Structure
Create the main Notes page with:
- Header and footer
- Tabs for "Browse Notes" and "My Notes"
- Upload button

### Step 3: Browse Notes Component
Build the browsing interface with:
- Search bar for text search
- Subject dropdown filter (primary filter)
- Level dropdown filter
- Notes cards with view/download actions

### Step 4: Note Upload Component
Create upload modal with:
- PDF file selection
- Title, Subject, Level (required fields)
- Description, Chapter/Topic, University (optional)
- Points reward on successful upload

### Step 5: My Notes Component
Build the management section with:
- List of user's uploaded notes
- Status badges (Pending/Approved/Rejected)
- View and delete actions

### Step 6: Navigation Updates
- Add "Browse Notes" link to Header
- Add Notes quick action to Dashboard
- Add Notes tab to Admin panel

---

## Points System
- **Notes Upload**: 50 points per approved note (same as papers)
- Points history will track note uploads separately with `action: "note_upload"`

---

## Mobile Responsiveness
All new components will follow the existing mobile-first patterns:
- Responsive grid layouts
- Touch-friendly buttons
- Stacked filters on mobile
- Hidden scrollbars (already configured)

