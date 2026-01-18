# 📋 Task Management Board (React Native)

A real-time Kanban-style task management application built with **React Native (Expo)** and **Supabase**. This project allows users to create boards, manage tasks with drag-and-drop, invite collaborators, and see real-time updates across devices.

## 🚀 Features

- **Authentication:** Secure email/password login via Supabase Auth.
- **Kanban Boards:** Create multiple project boards.
- **Drag & Drop:** Smoothly move tasks between columns (Todo, In Progress, Done).
- **Real-Time Sync:** Instant updates for tasks and board members using Supabase Realtime.
- **Collaboration:** Invite users by email to join your board.
- **User Presence:** See who is currently viewing the board and editing tasks.
- **Optimistic UI:** Instant feedback for actions (like moving tasks) before server confirmation.
- **Offline First:** React Query caching for seamless experience.

## 🛠 Tech Stack

### Frontend (Mobile)

- **React Native / Expo:** The core framework for cross-platform mobile development.
- **Expo Router:** File-based routing for easy navigation.
- **TypeScript:** Static typing for better code quality and developer experience.
- **React Query (TanStack Query):** Powerful data fetching, caching, and state management.
- **Reanimated & Gesture Handler:** For high-performance animations and touch handling (drag & drop).
- **@shopify/flash-list:** Fast list rendering for better performance than standard FlatList.
- **Tailwind CSS (via NativeWind):** Utility-first styling for React Native components.

### Backend & Database

- **Supabase:** An open-source Firebase alternative providing:
  - **PostgreSQL:** The primary relational database.
  - **Auth:** User management and RLS (Row Level Security).
  - **Realtime:** Broadcasting database changes via WebSockets.

## 🏃‍♂️ How to Run Locally

### 1. Prerequisites

- Node.js installed.
- Expo CLI installed (`npm install -g expo-cli`).
- A [Supabase](https://supabase.com/) project set up.

### 2. Database Setup (Supabase SQL)

Run the following SQL in your Supabase SQL Editor to create tables and enable realtime:

```sql
-- Create Tables
create table profiles (
  id uuid references auth.users not null primary key,
  email text unique,
  full_name text
);

create table boards (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  owner_id uuid references profiles(id) not null,
  created_at timestamptz default now()
);

create table board_members (
  board_id uuid references boards(id) on delete cascade,
  user_id uuid references profiles(id),
  status text default 'pending', -- pending, accepted
  primary key (board_id, user_id)
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references boards(id) on delete cascade,
  title text not null,
  description text,
  status text default 'TODO', -- TODO, IN_PROGRESS, DONE
  priority text default 'MEDIUM', -- LOW, MEDIUM, HIGH
  assignee_id uuid references profiles(id),
  position serial, -- For ordering
  due_date timestamptz,
  created_at timestamptz default now()
);

create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  type text not null, -- INVITE, etc.
  content text,
  is_read boolean default false,
  meta_data jsonb,
  created_at timestamptz default now()
);

-- Enable Realtime
alter publication supabase_realtime add table boards, board_members, tasks, notifications;
```
