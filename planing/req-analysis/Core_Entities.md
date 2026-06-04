# Core Entities - Heritage Hub

## 1. Identity & Profile
```
1.1. User: Core account information (Email, hashed password, preferences, role).

1.2. PersonalityProfile: Stores the derived persona (Explorer, Historian, etc.) and tracks personality-specific metrics.
```

## 2. Core Domain (Content Hierarchy)
```
2.1. City: Geographical parent container.

2.2. Monument: The primary points of interest within cities.

2.3. Category: Enables flexible grouping of monuments (e.g., Tombs, Statues).
```

## 3. Immersive & Educational Content
```
3.1. Panorama: Stores metadata and URLs for the 360° assets.

3.2. Hotspot: Coordinate-based markers within a panorama.

3.3. MediaAsset: Polymorphic storage for HD photos, maps, and infographics.

3.4. TimelineEvent: Chronological markers for history.

3.5. AwarenessCard: Contextual safety, cultural, and "Did you know?" content snippets.
```

## 4. Gamification Engine
```
4.1. Quiz: Definitions for city/site-specific assessments.

4.2. Question: The actual content (questions, distractors, correct answers, explanations).

4.3. QuizAttempt: Tracks a user's performance on a specific quiz.

4.4. Achievement: The "Master" list of all badges available.

4.5. UserAchievement: Links a user to their unlocked badges.

4.6. XPTransaction: The ledger of all earned XP and Coins (your "Audit Trail").

4.7. Challenge: Dynamic goals assigned to users.
```

## 5. User Interactions (The "Signals" & The Junction Tables)
```
5.1. Favorite: Junction table between User and Monument.

5.2. Rating: Junction table for user feedback on specific entities.

5.3. Report: User-submitted content error tickets.

5.4. ReportResponse: Admin feedback loop linked to a specific report.

5.5. UserInteraction: (The "Secret Sauce") Logs every meaningful user action (view, zoom, tap duration) used to train your AI agents.
```

## 6. AI & Recommendation Context
```
6.1. ChatSession: Stores the meta-data of a conversation.

6.2. ChatMessage: The actual exchange of messages for context/history.

6.3. RecommendationSnapshot: A cached list of personalized suggestions for the user, updated by the Recommendation Agent.
```

## 7. System
```
7.1. Notification: Stores in-app alerts and status updates for users.
```