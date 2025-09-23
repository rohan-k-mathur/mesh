# Software Requirement Specification: Mobile App (iOS)

## 1. Introduction
### 1.1 Purpose
This document defines the requirements and architecture for adapting the Mesh web application into a native-like iPhone app. The goal is to reuse existing functionality while providing a mobile-focused user experience.

### 1.2 Scope
The iOS app will mirror core Mesh features: authentication, real-time rooms with nodes, and the social feed. Mobile-specific enhancements such as push notifications and offline access are included.

### 1.3 References
- `README.md`
- `Mesh_Roadmap.md`
- Existing SRS documents in the repository

## 2. Overall Description
The mobile app extends the Next.js platform using a React Native stack. Shared business logic and API calls will be placed in cross-platform modules. The UI will be built with React Native components for a native feel, while the real-time canvas leverages React Native Web or a Canvas API wrapper. Capacitor may be used initially to wrap the web app for rapid prototyping, followed by a full React Native implementation.

## 3. System Features
### 3.1 Cross-Platform Shell
- **Description:** Establish a React Native project (Expo or bare) that consumes shared modules from the web codebase.
- **Capabilities:** Support over-the-air updates and reuse of TypeScript types.

### 3.2 Authentication & Onboarding
- **Description:** Recreate login, register, and onboarding flows with mobile-friendly forms.
- **Integration:** Connect to existing Firebase and Supabase endpoints.

### 3.3 Real-Time Rooms
- **Description:** Mobile version of the collaborative canvas with node creation and presence updates.
- **Implementation:** Use React Native Web or custom rendering to display nodes and handle gestures.

### 3.4 Notifications & Offline Support
- **Description:** Enable push notifications for room invites and mentions.
- **Offline:** Cache recent rooms and posts locally using SQLite or AsyncStorage.

### 3.5 Settings & Account Management
- **Description:** Provide profile editing, theme selection, and logout within a dedicated settings screen.

## 4. External Interface Requirements
### 4.1 User Interfaces
- React Native screens optimized for touch gestures and small displays.
- Consistent navigation using a bottom tab bar and stack navigators.

### 4.2 Hardware Interfaces
- Camera and microphone access for multimedia uploads and livestreams.
- Push notification tokens via Apple Push Notification service (APNs).

### 4.3 Software Interfaces
- Mesh API routes for posts, rooms, and authentication.
- Supabase real-time channels and storage.
- LiveKit client for audio/video streams.

## 5. Non-Functional Requirements
- **Performance:** Initial load time under 2 seconds on modern iPhones.
- **Security:** Reuse existing auth middleware; store tokens securely in the keychain.
- **Reliability:** Graceful handling of intermittent connectivity.
- **Maintainability:** Shared TypeScript modules and consistent linting with `npm run lint`.
- **Usability:** Touch-optimized controls and accessible color contrasts.

## 6. User Flows
1. **Launch & Sign In** – User opens the app, sees the sign-in screen, and authenticates via Firebase.
2. **Home Feed** – After login, the feed shows recent posts with infinite scroll.
3. **Join Room** – User taps a room from the feed or search, enters the real-time canvas, and sees other participants.
4. **Create Node** – User presses an add button to create text, image, or livestream nodes using mobile-friendly modals.
5. **Notifications** – Invites and mentions trigger push notifications; tapping them deep-links to the relevant room.
6. **Edit Profile** – From settings, the user updates profile fields and saves changes to the backend.

## 7. System Architecture
The mobile project will reside in a separate directory but share code through a common package. Core services (API clients, authentication hooks, state management) are extracted into reusable modules. React Native screens render data from these modules. Real-time features communicate with Supabase and LiveKit using existing libraries compiled for iOS. For early prototypes, the web app may be wrapped with Capacitor to validate workflows before investing in full native components.

## 8. Product Development Roadmap
1. **Research & Planning** – Evaluate React Native vs. Capacitor, select tooling (Expo, React Native CLI), and outline code-sharing strategy.
2. **Project Setup** – Initialize the mobile repository, configure TypeScript paths, and set up continuous linting.
3. **Authentication Screens** – Implement login and onboarding flows, integrating Firebase tokens.
4. **Feed & Navigation** – Build tab navigation and fetch posts from existing API routes.
5. **Real-Time Canvas** – Port React Flow logic using React Native Web or a custom renderer; implement node creation modals.
6. **Push Notifications** – Register with APNs and handle deep links to rooms.
7. **Offline Caching** – Store recent posts and room data locally for limited offline use.
8. **Beta Testing** – Distribute via TestFlight, gather feedback, and fix issues.
9. **Public Release** – Submit to the App Store and monitor crash reports and analytics.

## 9. Testing Plan
- Unit tests for shared modules and React Native components.
- Integration tests simulating room interactions and push notifications.
- End-to-end tests with Detox or a similar framework.
- Continuous linting with `npm run lint` before every merge.

## 10. Future Considerations
- Expand to Android using the same React Native codebase.
- Investigate full offline mode and background sync.
- Explore native modules for advanced gestures or AR features.

