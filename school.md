# Qidzo School Pages Feature Documentation

## 🎯 Overview

The **School Pages** feature in Qidzo is designed to function similarly
to **LinkedIn Company Pages** or **Facebook Business Pages**, but
specifically for schools and colleges.

Each school gets its own dedicated page where they can:

-   Share updates and announcements
-   Post events, notices, and circulars
-   Interact with parents and students
-   Conduct paid online exams
-   Build their digital presence

Example URL:

    qidzo.com/abc-school

------------------------------------------------------------------------

## 🏫 Part 1: School Profile Page

Similar to an Instagram profile, each school page will include:

-   School logo
-   Banner image
-   Custom brand colors
-   About section (vision, mission, facilities)
-   Contact information
-   Location details
-   Courses and grades offered
-   Photo and video gallery
-   Verified badge (for paid schools)

------------------------------------------------------------------------

## 📢 Part 2: School Content Posting

Schools can create posts similar to Facebook Pages:

Supported content types:

-   Text announcements
-   Images (event posters, notices)
-   PDF files (timetables, circulars)
-   Short videos (event invitations)

------------------------------------------------------------------------

## 📂 Part 3: Post Categories and Tabs

School pages will organize posts into categories:

-   📢 Announcements (exam dates, holidays)
-   🎓 Admissions (admission open notices)
-   📝 Exams (exam schedules)
-   📊 Surveys (parent feedback)
-   🖼 Gallery (event photos)
-   📅 Events (sports day, annual function)

------------------------------------------------------------------------

## ❤️ Part 4: Social Interaction Features

Parents and students can interact with school pages:

-   Follow schools
-   See school posts in their feed
-   Like posts
-   Comment on posts
-   School admins can moderate comments

------------------------------------------------------------------------

## 💰 Part 5: Paid Exams Feature (Monetization)

Schools can create online exams with premium features:

-   Multiple-choice tests
-   Time-limited exams
-   Automatic grading
-   Result reports generation
-   Student performance tracking

This is a **paid feature** --- schools pay Qidzo to use it.

------------------------------------------------------------------------

## 📊 Part 6: School Dashboard

School administrators get access to analytics including:

-   Total followers
-   Post engagement (likes, comments)
-   Survey responses
-   Exam participation statistics
-   Admission inquiries

------------------------------------------------------------------------

## 🌍 Real-World Example

### ABC International School

Profile URL:

    qidzo.com/abc-international-school

### Profile Information

-   Logo and banner
-   About section
-   Grades: Nursery to 12th
-   Campus and facility photos

### Example Posts

-   📢 Annual Day on Dec 25th! Parents invited.
-   📝 Mid-term exams from Jan 10--15. Timetable attached.
-   🎓 Admissions open for 2025--26 session.

### Parent Interaction Example

-   Sarah follows ABC School
-   Sarah sees posts in her feed
-   Sarah likes the Annual Day post
-   Sarah comments: "Excited for this event!"

### Exam Example

Math test for Class 5:

-   20 MCQs
-   30-minute duration
-   Auto grading enabled
-   Results emailed automatically

### Analytics Example

-   Followers: 1,200
-   Annual Day Post: 450 likes, 89 comments
-   Math Exam Participation: 85 students

------------------------------------------------------------------------

## 🚀 Summary

The School Pages feature enables schools to:

-   Build digital presence
-   Communicate effectively
-   Engage parents and students
-   Conduct online exams
-   Access analytics
-   Monetize through premium features

This transforms Qidzo into a complete **digital ecosystem for schools**.

## Phase Breakdown and Scope

To keep implementation clean and avoid confusion, the feature can be split into phases:

- Phase 1: Core school entity, registration and basic profile
- Phase 2: School posts, categories/tabs and followers in the main feed
- Phase 3: Surveys, analytics dashboard and moderation tools
- Phase 4: Paid exams module and advanced reporting

Right now we focus only on Phase 1: the database schema and the school registration flow.

## Phase 1 – Data Model and Schema

Existing system already has:

- parents table (linked to Clerk users, subscription plans, etc.)
- children table (kid profiles, school_name text field, city, country)

School Pages introduce a separate organization layer on top of this. A parent can be an admin of one or more schools, and parents/children can later follow schools.

### 1. schools table (core entity)

Represents a school or college and powers the public School Page like qidzo.com/abc-school.

Suggested columns:

- id (uuid, primary key)
- slug (text, unique, used in URL, e.g. abc-international-school)
- name (text, required, e.g. “ABC International School”)
- logo_url (text, nullable)
- banner_url (text, nullable)
- brand_primary_color (text, nullable, hex or Tailwind token)
- brand_secondary_color (text, nullable)
- about (text, long description, mission, vision, facilities)
- contact_email (text, nullable)
- contact_phone (text, nullable)
- website_url (text, nullable)
- address_line1 (text, nullable)
- address_line2 (text, nullable)
- city (text, nullable)
- state (text, nullable)
- country (text, nullable, default “India”)
- postal_code (text, nullable)
- grades_offered (text or jsonb: for storing e.g. ["Nursery","K-12"])
- is_verified (boolean, default false, driven by admin review or payment)
- is_active (boolean, default true, for soft disabling a school page)
- subscription_plan (text, default "FREE", values: FREE, BASIC, PRO, ELITE)
- subscription_status (text, default "TRIAL", values: TRIAL, ACTIVE, EXPIRED, CANCELLED)
- subscription_starts_at (timestamptz, nullable)
- subscription_ends_at (timestamptz, nullable)
- clerk_id (text, Clerk user id for this school account)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 2. Reusing existing social tables (follows, posts, likes, comments)

We already have global social tables for parents and children:

- follows (parent/child follows parent/child)
- posts (child posts with media, counts, etc.)
- likes (parent/child likes a post)
- comments (parent/child comments on a post)

We do not create separate school-specific versions of these. Instead, we extend or reuse them:

- For following schools:
  - Later, we can extend the existing follows table so that the “following” side can also point to a school (for example by adding following_school_id and allowing following_type = 'SCHOOL'), while keeping the same follower_parent_id / follower_child_id design.
  - No new school_followers table is needed.

- For school posts:
  - We keep using the posts table so likes and comments continue to work exactly the same way.
  - In a later phase, we can add optional fields such as school_id and an owner_type/publisher_type flag so a post can be owned either by a child or by a school, without touching likes and comments schema.

This keeps the schema simple and avoids duplicate “posts / followers / likes / comments” tables. Phase 1 only requires the new schools and school_admins tables; social integration can come later by evolving the existing tables.

### 3. Optional school gallery table

For a richer gallery experience (beyond simple posts), we can introduce a dedicated table for school media items:

- id (uuid, primary key)
- school_id (uuid, fk → schools.id)
- media_url (text, required)
- media_type (enum or text, e.g. "IMAGE", "VIDEO")
- title (text, nullable)
- description (text, nullable)
- tags (jsonb, optional, e.g. ["sports-day","2026"])
- event_date (date, nullable)
- created_at (timestamptz, default now())
- is_active (boolean, default true)

This powers a “Gallery” tab on the school page. Later, gallery items can also be referenced from posts if needed, but the table itself is not strictly required for Phase 1; it is a recommended enhancement for when we implement the visual gallery.

## Phase 1 – School Registration Flow (via School login/register)

Goal: allow a school to register itself using its own login (separate from parent login), create its basic profile, and manage its page directly.

High-level flow:

1. Entry point (auth level)
   - On the main login/landing page, show two primary options:
     - Parent Login / Register
     - School Login / Register
   - When a user chooses School Login / Register, they are taken into the school auth flow (using the same auth provider under the hood, but treated as a “school” account type).

2. New school registration
   - If the school does not have an account yet:
     - Collect basic auth fields (email, password, contact person name).
     - On successful auth signup, create a new row in schools with:
       - name, slug, city, country, grades_offered, contact_email, contact_phone
       - an auth reference field (e.g. auth_user_id / clerk_id for this school account)
       - is_verified = false, is_active = true
   - Redirect the school user to a short onboarding wizard to complete the profile.

3. Step 1: Basic school details (onboarding)
   - Fields: school name, country, city, state, grades offered, contact email, phone.
   - Generate a slug from the name (ensure uniqueness, handle clashes with number suffix).
   - Update the existing schools row for this school auth user with these values.

4. Step 2: Brand and visuals
   - Optional uploads: logo, banner.
   - Optional brand colors (primary, secondary).
   - Update logo_url, banner_url, brand_primary_color, brand_secondary_color in schools.

5. Step 3: About and location
   - About text (vision, mission, facilities).
   - Address fields (address_line1, address_line2, city, state, postal_code, country).
   - Save/update these fields in the same schools row.

6. Completion
   - Redirect to the school profile page: /schools/[slug] for public view.
   - Provide a separate “School Dashboard” area where the logged-in school can edit profile, manage gallery and later create posts/exams.
   - Show a banner like “Your school page is live but not verified yet”; verification and paid features are separate later phases.

Notes for integration with existing data:

- The existing child.school_name field can remain as a free text field for now.
- In a later step, we can add optional child.school_id (fk → schools.id) and migrate data gradually.
- Parents and children continue to use their existing login flows; schools have their own login/register entry point and own auth identity.
