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

### Testing Framework

- **Jest:** JavaScript testing framework.
- **React Native Testing Library (RNTL):** Lightweight testing utilities to test React Native components.
- **Jest Expo:** Preset for configuring Jest in an Expo environment.

## ⚠️ Important: Development Build Required

This project uses **native libraries** (`react-native-mmkv` and `react-native-keyboard-controller`) that are not supported in the standard **Expo Go** app.

You **cannot** run this project using `npx expo start` with the Expo Go app. You must use a **Development Build**.

# For Android

npx expo run:android

# For iOS

npx expo run:ios

## 🧪 Testing

This project employs **Unit and Integration Testing** to ensure reliability across authentication, data fetching, and user interactions.

### Testing Setup

Tests are located in `__tests__` directories adjacent to the features they test. We use `jest.mock()` extensively to isolate components from external services like Supabase, Expo Router, and Device Storage.

- **Mocking:** External dependencies (Supabase, Navigation, Async Storage) are mocked to prevent network calls during tests.
- **Environment:** Tests run in a Node.js environment via Jest, simulating the React Native runtime.

### How to Run Tests

Run the following commands in your terminal:

```bash
# Run all tests
npm test

# Run tests in watch mode (interactive)
npm test -- --watch

# Run a specific test file
npm test -- BoardListScreen

# Clear Jest cache (if you encounter strange errors)
npx jest --clearCache
```
