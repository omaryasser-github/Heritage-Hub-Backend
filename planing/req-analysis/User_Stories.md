# Heritage Hub — Revised User Stories (INVEST-Compliant)

## 👥 User Management

## US-01 — Email Registration
```
As a new visitor, I want to register using my email and password so that I can create a personal account.

Acceptance Criteria:

- Email field validates format in real time before submission (FR-4)
- Duplicate email detection returns a clear inline error message without full page reload
- Password must meet minimum complexity .
- Password is hashed server-side; plaintext is never stored or logged (NFR-12)
- On success, user receives a verification email and is redirected to onboarding
<!-- - Entire registration flow completes within 60 seconds (NFR-7) -->
```

## US-02 — Social Authentication
```
As a new visitor, I want to register or log in using Google, Facebook, or Apple so that I don't have to manage another password.

Acceptance Criteria:

- All three providers (Google, Facebook, Apple) complete auth via OAuth 2.0 (NFR-11)
- Apple Sign-In is fully functional to satisfy iOS App Store requirements (NFR-14)
- Failed OAuth flow shows a descriptive error, not a blank screen
<!-- - Social login completes and lands the user on home within 60 seconds (NFR-7) -->
```

## US-03 — Guest Browsing
```
As an unregistered user, I want to browse the app as a guest so that I can explore content before committing to registration.

Acceptance Criteria:

- App launches directly into guest mode with zero mandatory steps
- Guest users can access: city search, panorama view, educational content, and the chatbot
- Guest users cannot access: favorites, quizzes, leaderboards, feedback submission, or profile
- No personally identifiable data is stored for guest sessions
```

## US-03b — Guest Login Wall
```
As a guest user, when I attempt a restricted action, I want to see a contextual login prompt so that I understand what I gain by registering.

Acceptance Criteria:

<!-- - Modal appears immediately (under 100ms) when a restricted action is tapped (NFR-3) -->
- Modal clearly states which feature requires registration and why it adds value
- Dismissing the modal returns the user to their exact previous view with no state loss
- Modal offers both email registration and social login options inline
- Modal does not appear more than once per session for the same restricted action
```

## US-04 — Edit Profile
```
As a registered user, I want to edit my profile information so that my details stay accurate and personalized.

Acceptance Criteria:

- User can update: display name, profile photo, preferred language (Arabic/English), and date of birth
- Changes are saved and reflected immediately on the profile dashboard without requiring logout
- Profile photo upload accepts JPG/PNG, max 5MB, and is resized server-side for CDN delivery
- Invalid input (empty name, unsupported file type) returns inline validation errors
- All updated fields are persisted in the database and survive app restart
```

## US-05 — Profile Dashboard
```
As a registered user, I want my profile to display my achievements, XP score, coins, and personality type so that I can track my overall progress at a glance.


Acceptance Criteria:

<!-- - Dashboard displays: total XP, coin balance, current personality type, earned badges, and completion percentage per category -->
- All values are fetched server-side and cannot be manipulated client-side
- Dashboard loads within 100ms for UI render; data populates within 1.5 seconds (NFR-3, NFR-2)
- If personality type has not yet been determined, a neutral placeholder with a progress indicator is shown
- Badges display in chronological order of earning with a timestamp
```

## US-06 — Favorites Collection
```
As a registered user, I want to save and manage favorite cities and monuments so that I can return to them quickly.

Acceptance Criteria:

- Favorite toggle (add/remove) is available on every city and monument card
- Favorites are persisted server-side and sync across devices on the same account
- Favorites list is accessible from the profile dashboard
- Guest users attempting to favorite are redirected to the login wall (US-03b)
```

## US-00 — Language & Locale Preference (New)
```
As a user, I want to set my preferred language (Arabic or English) so that all content, narration, and UI elements are consistently displayed in my chosen language.

Acceptance Criteria:

<!-- - Language selection is available during onboarding and inside profile settings -->
- Switching to Arabic activates full RTL layout alignment across all screens (NFR-17)
- Switching to English activates LTR layout
- Language preference is persisted server-side for registered users and locally for guests
- Language switch takes effect immediately without requiring app restart
```

## 🔍 Discovery & Search

## US-07 — City Text Search
```
As a user, I want to search for Egyptian cities by name so that I can quickly navigate to the destination I want.

Acceptance Criteria:

- Search is accessible from the home screen with a single tap
- Search accepts Arabic and English input and returns relevant results in both
- If no results are found, a friendly empty state message is shown with suggested alternatives
- Search results display city name, thumbnail, and category tag
- Search history is stored locally for registered users (last 10 queries)
```

## US-08 — Search Auto-Suggestions
```
As a user, I want auto-suggestions to appear as I type so that I can find results faster without knowing the exact name.

Acceptance Criteria:

- Suggestions appear after the first 3 characters are typed
<!-- - Each keystroke triggers a debounced query with UI feedback within 100ms (NFR-3) -->
- Suggestions include city names, monument names, and categories
- Tapping a suggestion navigates directly to that entity's detail page
- Suggestions support both Arabic and English input simultaneously
```

## US-09 — Category Filtering
```
As a user, I want to filter displayed content by category so that I can only see content relevant to my interests.

Acceptance Criteria:

- Filter options available: History, Monuments, Tombs, Statues, Wars, Culture (FR-10)
- Multiple filters can be selected simultaneously
- Active filters are visually highlighted and persist during the current session
- Clearing all filters restores the full unfiltered content list
- Filter state resets between separate app sessions
```

## 🌐 Panorama & Exploration

## US-10 — 360° Panorama Entry
```
As a user, I want to enter a 360° panoramic view of a monument so that I can explore it immersively without being physically present.

Acceptance Criteria:

<!-- - Panorama loads fully within 2–3 seconds on 4G/5G connections (NFR-1) -->
- If connection is slow, a lower-quality tier loads first with a progressive upgrade (adaptive quality)
- Loading progress is communicated via a visible progress indicator — no blank screen
- Panorama is functional on Android 9+ and iOS 13+ (NFR-14)
- If panorama fails to load, a descriptive error with a retry button is shown
```

## US-11 — Panorama Navigation Controls
```
As a user, I want to rotate, zoom, and move through the panorama using touch gestures so that I have full spatial control of my exploration.

Acceptance Criteria:

<!-- - Pinch-to-zoom and drag-to-rotate gestures respond within 100ms with no visible lag (NFR-3) -->
- Zoom has defined minimum and maximum bounds to prevent disorienting views
- Gyroscope-based navigation is available as an optional toggle on supported devices
- Controls work consistently on both tablet and mobile screen sizes (NFR-15)
```

## US-12 — Interactive Hotspots
```
As a user, I want to tap labeled hotspots within the panorama to reveal contextual information or images so that I can learn details about specific points of interest in place.

Acceptance Criteria:

- Hotspots are visually distinct (pulsing icon) and do not obstruct the panorama view
- Tapping a hotspot opens an overlay panel with text, image, or both
- Overlay can be dismissed without exiting the panorama
- Hotspot content respects the user's selected language preference
- Each monument panorama contains a minimum of 3 hotspots
```

<!-- US-13 — Multi-Language Audio Narration
As a user, I want guided narration to play automatically when I enter a panorama so that I receive contextual information in my preferred language.

Acceptance Criteria:

- Narration begins automatically based on the user's stored language preference
- An in-panorama toggle allows switching between Arabic and English audio without exiting
- Switching to Arabic dynamically transitions relevant UI elements to RTL alignment (NFR-17)
- Narration can be paused, resumed, or muted at any time
- If the audio file fails to load, a text transcript fallback is displayed -->


## 📚 Interactive Content

## US-14 — Rich Media Assets
```
As a user, I want to view HD photos, infographics, and maps for each city and monument so that I have rich visual reference material to complement my exploration.

Acceptance Criteria:

- Each city and monument page contains at minimum: 1 HD photo, 1 map, and 1 infographic
- Images load progressively (low-res placeholder first, then full resolution)
- Images are zoomable via pinch gesture
- All assets are served via CDN for performance (NFR-1)
- Assets render correctly on both mobile and tablet layouts (NFR-15)
```

## US-15 — Historical Timelines
```
As a user, I want to explore an interactive timeline for each historical era so that I can understand events in their chronological context.

Acceptance Criteria:

- Timeline is horizontally scrollable with era markers and event cards
- Each event card displays: date, title, brief description, and an associated image
- Tapping an event card expands a detailed view without leaving the timeline
- Timeline content is available in both Arabic and English (NFR-16)
- Timeline renders correctly on both mobile and tablet screen sizes (NFR-15)
```

<!-- US-16 — Educational Video Streaming
As a user, I want to watch educational videos linked to specific monuments so that I can absorb historical information through a different medium.

Acceptance Criteria:

- Video player is embedded natively within the monument detail page
- Videos support pause, play, seek, and fullscreen controls
- Videos stream adaptively based on connection speed to prevent excessive buffering
- Each monument has at least one associated video
- Captions are available in Arabic and English (NFR-16) -->


## 🤖 AI Features

## US-17 — Contextual AI Chatbot
```
As a user, I want to ask the chatbot about history, culture, or app navigation so that I can get instant answers without leaving my current screen.

Acceptance Criteria:

- Chatbot is accessible as a persistent floating button on all main screens
<!-- - Response is rendered on screen within 1.5–3 seconds of submission (NFR-2) -->
- If the AI fails to respond within 5 seconds, a fallback message is shown with a retry option
- Chatbot retains context for the current session (last 10 messages minimum)
- Chatbot gracefully handles out-of-scope questions with a redirect suggestion
```

## US-18 — Chatbot Bilingual Support
```
As a user, I want the chatbot to detect and respond in whichever language I write in so that I can interact naturally without switching settings.

Acceptance Criteria:

- Chatbot auto-detects input language (Arabic or English) per message
- Response is always returned in the same language as the user's input
- Arabic responses use correct grammar and RTL text rendering (NFR-17)
- Language detection does not add more than 200ms to the response time
- Mixed-language input defaults to the user's stored language preference
```

## US-19 — Quiz Generation
```
As a registered user, I want the system to generate a quiz for the city or monument I just explored so that I can immediately test what I learned.

Acceptance Criteria:

- Quiz is offered via a prompt immediately after a panorama or content page is exited
- Quiz contains between 5 and 10 questions per session
<!-- - Questions include multiple types: multiple choice, true/false, image-based (FR-21) -->
- Quiz content is contextually tied to the specific city or monument just viewed
- If the AI agent is unavailable, a pre-cached fallback quiz is served (NFR-9)
```

## US-20 — Adaptive Quiz Difficulty
```
As a registered user, I want quiz difficulty to automatically adjust based on my past performance so that I am always appropriately challenged.

Acceptance Criteria:

- Quiz Agent evaluates the user's last 5 quiz scores asynchronously before quiz initialization
- Difficulty levels are: Beginner, Intermediate, Advanced — clearly labeled at quiz start
- A user with no history defaults to Beginner
- Difficulty adjustment logic runs server-side and does not delay quiz load beyond 3 seconds
- User can manually request a harder or easier difficulty before starting (negotiable override)
```

## US-21 — Answer Explanations
```
As a registered user, I want to see a clear explanation after each quiz answer so that I learn from both correct and incorrect responses.

Acceptance Criteria:

- Explanation is shown immediately after each answer is submitted, before moving to the next question
<!-- - Correct answers show a positive reinforcement message plus a 1–2 sentence historical explanation -->
- Incorrect answers show the correct answer highlighted plus a full explanation
- Explanations are available in the user's selected language (NFR-16)
<!-- - Explanations are sourced from the same knowledge base as the chatbot for consistency -->
```

## US-22 — Behavioral Recommendations
```
As a registered user, I want the system to recommend cities and monuments based on my browsing and quiz history so that I discover relevant content without manual searching.

Acceptance Criteria:

- Recommendation Agent triggers asynchronously after any of: adding a favorite, completing a quiz, or viewing a monument page (FR-24, FR-25)
- Recommendations are displayed on the home screen as a dedicated "For You" section
- A minimum of 3 recommendations are always shown; refreshed after each trigger event
- Each recommendation card shows: city/monument name, category, and reason for recommendation ("Because you explored Luxor...")
- If insufficient user data exists (new user), recommendations default to top-rated content globally
```

<!-- US-23 — Personalized Learning Paths
As a registered user, I want a structured learning path generated for me so that I have a guided journey through Egyptian history tailored to my interests.

Acceptance Criteria:

- Learning path is generated after the user completes their first 3 interactions (quiz, panorama, or favorite)
- Path is displayed as an ordered sequence of cities and monuments with progress tracking
- Completing a step in the path unlocks the next step visually
- Path updates dynamically when the user's interests or personality type changes
- User can view path progress percentage on their profile dashboard -->


## US-24 — Automatic Personality Assessment
```
As a registered user, I want the system to analyze my behavior across multiple activity types so that it can determine and display my historical personality type.

Acceptance Criteria:

- Personality Agent evaluates behavior across: quizzes completed, panoramas viewed, categories browsed, and favorites saved — not quizzes alone
- Assessment runs as a background job triggered every 5 qualifying interactions (any type)
- Personality types are: Explorer, Historian, Strategist, Culture Lover (FR-29)
- Result is displayed on the profile dashboard; user is notified via in-app notification
- If insufficient data exists, profile shows "Discovering your type..." with a progress indicator
- Background job does not impact frontend response times (NFR-3)
```

## US-25 — Personality-Based Challenges
```
As a registered user, I want to receive personalized challenges based on my determined personality type so that I have clear, motivating goals to work toward.

Acceptance Criteria:

- Completing a challenge awards XP, coins, and a personality badge (FR-30)
- Expired or completed challenges are replaced within 24 hours by the Personality Agent
```

## US-26 — Cultural Awareness Messages
```
As a user viewing a city or monument page, I want to see cultural awareness messages about customs, dress codes, and local greetings so that I can behave respectfully during a visit.

Acceptance Criteria:

- Cultural awareness card appears automatically on every city and monument detail page
- Content covers at minimum: dress code guidance, local greeting customs, and photography etiquette
- Content is generated or retrieved by the Awareness Agent and cached per city (FR-32)
- Messages are available in both Arabic and English (NFR-16)
- Content can be expanded for more detail or collapsed to save screen space
```

## US-27 — Safety & Seasonal Awareness
```
As a user, I want to receive safety tips and seasonal visit guidance for each city so that I can plan a safe and well-timed trip.

Acceptance Criteria:

- Safety awareness section is present on every city detail page
- Content covers: best visiting months, heat warnings, restricted zones, and areas unsafe for elderly or children (FR-37, FR-38, FR-39)
- Seasonal data is updated at minimum monthly by an admin or automated agent
- Content is available in both Arabic and English (NFR-16)
- Critical safety warnings (e.g., restricted area) are visually distinguished with a warning icon
```

<!-- US-28 — Price Awareness
As a user, I want to see typical price ranges for souvenirs, food, transport, and services near each site so that I can budget accurately and avoid being overcharged.

Acceptance Criteria:

- Price awareness section is present on every city detail page (FR-40)
- Covers minimum 4 categories: souvenirs, food, local transport, entry fees
- Price data displays a range (min–max) not a single figure
- Content includes a "scam alert" flag for known overcharging patterns at that location
- Prices are displayed in Egyptian Pounds with an optional USD conversion
- Data is reviewed and updated at minimum quarterly -->


## US-29 — Contextual "Did You Know?" Facts
```
As a user, I want brief educational facts to appear contextually while I browse so that I passively absorb interesting historical knowledge.

Acceptance Criteria:

- A "Did You Know?" card appears on city, monument, and panorama pages — one per page view
- Facts are contextually relevant to the specific page being viewed, not generic
- Facts are generated or retrieved by the Awareness Agent (FR-35)
- Fact card is dismissible without disrupting the page layout
- Content is available in Arabic and English (NFR-16)
- The same fact does not repeat for the same user within a 30-day window
```

## 🏆 Gamification

## US-30 — XP & Coin Rewards
```
As a registered user, I want to earn XP and coins for completing quizzes and exploring content so that my engagement is tangibly rewarded.

Acceptance Criteria:

- XP is awarded for: completing a quiz (+XP based on score), viewing a panorama, completing a learning path step
- Coin rewards are awarded for: perfect quiz scores, first visit to a new city, completing a challenge
- All XP and coin calculations are performed server-side to prevent manipulation (FR-44)
- Reward notification appears on screen within 100ms of the triggering action (NFR-3)
- XP and coin totals update in real time on the profile dashboard
```

## US-31 — Category Mastery Badges
```
As a registered user, I want to earn a badge when I complete all monuments in a category so that I have visible recognition of my mastery.

Acceptance Criteria:

- A badge is awarded automatically when a user completes all monuments within a defined category (FR-46)
- Badge is displayed on the profile dashboard with category name, icon, and date earned
- Badge award triggers an in-app notification
- Each of the 6 categories (History, Tombs, Statues, Wars, Culture, Monuments) has a unique badge design
- Badge data is stored server-side and persists across devices
```

## US-32 — Awareness Achievements
```
As a registered user, I want to earn awareness-specific achievements so that my responsible and informed behavior is recognized beyond just quiz performance.

Acceptance Criteria:

- Awareness achievements awarded for: completing awareness quizzes, reading all awareness cards for a city, and reporting accurate content errors (FR-42, FR-48)
- Achievements are stored server-side and displayed on the profile dashboard
```

## US-33 — Quiz Replay
```
As a registered user, I want to retake any quiz I have previously completed so that I can improve my score and reinforce my learning.

Acceptance Criteria:

- Retake option is available on the quiz results screen and from the city/monument detail page
- On retake, at least 60% of questions are regenerated or reshuffled to prevent memorization gaming
- Previous best score is displayed alongside the new attempt score for comparison
- XP is awarded at a reduced rate (50%) for retakes to maintain fairness
- Retake count per quiz is tracked and displayed on the user's profile
```

<!-- US-34 — Competitive Leaderboards
As a registered user, I want to view weekly, monthly, and all-time leaderboards ranked by XP so that I can compare my progress with other users.
Acceptance Criteria:

Three leaderboard views are available: Weekly, Monthly, All-Time (FR-49, FR-50)
Each entry displays: rank, username, avatar, and XP total for the period
The current user's own rank is always pinned and visible even if outside the top 20
Leaderboard data is refreshed at minimum every 15 minutes using Redis cache
Guest users can view leaderboards in read-only mode but cannot appear on them -->


## 📝 Feedback Loop

## US-35 — Content & Feature Rating
```
As a registered user, I want to rate cities, monuments, and app features so that I can contribute to platform quality.

Acceptance Criteria:

- Rating control (1–5 stars) is available on every city and monument detail page (FR-51)
- User can update their rating at any time; only the most recent rating counts
- Aggregate rating is displayed publicly on the city/monument card
- Rating submission triggers an async feedback analysis pipeline (FR-53)
- Guest users see aggregate ratings but cannot submit their own
```

## US-36 — Inaccuracy Reporting
```
As a registered user, I want to report incorrect or misleading content so that the platform maintains historical accuracy.

Acceptance Criteria:

- Report button is accessible on every content card, panorama, and fact display (FR-52)
- Report form requires selecting a reason (Wrong information, Outdated, Offensive, Other) plus an optional free-text description
- Submission confirmation is shown immediately; report is queued for admin review
- User receives an in-app notification when their report has been reviewed
- A single user cannot submit more than 3 reports per day to prevent abuse
```

## US-37 — Feedback Response Visibility
```
As a registered user, I want to view the admin's response to my submitted feedback so that I know my input was taken seriously.

Acceptance Criteria:

<!-- - User's feedback history and admin responses are accessible from the profile dashboard -->
- Response displays: original feedback, admin reply text, and response timestamp
- If feedback is dismissed without a response, user sees a "Reviewed — No Action Required" status
- Notification is sent to the user when a response is posted (in-app)
```

## 🛠️ Admin Panel

## US-38 — Content Management Dashboard
```
As an admin, I want to upload and manage panoramas, images, videos, and text content via a web dashboard so that the platform stays current without requiring developer involvement.

Acceptance Criteria:

- Dashboard is a web interface accessible via modern browsers (Chrome, Firefox, Safari)
- Supports upload of: panoramic images (equirectangular format), HD photos, MP4 videos, and text content
- Uploaded panoramas are auto-processed and optimized for CDN delivery (NFR-5, NFR-19)
- Admin can assign content to specific cities, monuments, and categories
- New content is live on the mobile app within 5 minutes of publishing
- All admin actions are logged with timestamp and admin user ID for audit trail
```

## US-39 — Feedback Moderation Queue
```
As an admin, I want to review user-submitted feedback and content reports in a prioritized queue so that I can efficiently resolve platform issues.

Acceptance Criteria:

- Queue displays all pending reports sorted by: report type, frequency (duplicate reports on same content), and submission date
- Admin can: approve (flag content for fix), dismiss, or escalate each item
- Responding to a report automatically triggers a notification to the reporting user (US-37)
- Queue shows resolution status: Pending, In Review, Resolved, Dismissed
- Admin cannot permanently delete user accounts or content from this panel (scope-limited for safety)
```

## US-40 — System Analytics Dashboard
```
As an admin, I want to view platform usage analytics and performance metrics so that I can make informed decisions about content priorities and infrastructure.

Acceptance Criteria:

- Dashboard displays: daily/weekly active users, most viewed cities and monuments, quiz completion rates, and average session duration
- AI agent performance metrics shown: average response time, fallback rate, cache hit rate (NFR-2)
- Reports are filterable by date range (last 7 days, 30 days, 90 days, custom)
- Data is exportable as CSV for offline analysis
- Dashboard data refreshes every 60 seconds automatically
```