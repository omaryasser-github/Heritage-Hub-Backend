erDiagram
  USER ||--o| PERSONALITY_PROFILE : has
  USER ||--o{ CHALLENGE : assigned
  USER ||--o{ USER_ACHIEVEMENT : earns
  USER ||--o{ XP_TRANSACTION : logs
  USER ||--o{ QUIZ_ATTEMPT : takes
  USER ||--o{ FAVORITE : saves
  USER ||--o{ RATING : submits
  USER ||--o{ REPORT : files
  USER ||--o{ CHAT_SESSION : opens
  USER ||--o{ RECOMMENDATION_SNAPSHOT : receives
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ USER_INTERACTION : generates

  CITY ||--o{ MONUMENT : contains
  CITY ||--o{ MEDIA_ASSET : has
  CITY ||--o{ AWARENESS_CARD : has
  CITY ||--o{ TIMELINE_EVENT : has
  CITY ||--o{ QUIZ : has
  CITY ||--o{ RATING : receives
  CITY ||--o{ REPORT : receives
  CITY ||--o{ FAVORITE : includes

  MONUMENT ||--o| PANORAMA : has
  MONUMENT ||--o{ MEDIA_ASSET : has
  MONUMENT ||--o{ AWARENESS_CARD : has
  MONUMENT }o--o{ CATEGORY : tagged
  MONUMENT ||--o{ QUIZ : has
  MONUMENT ||--o{ RATING : receives
  MONUMENT ||--o{ REPORT : receives
  MONUMENT ||--o{ FAVORITE : includes

  PANORAMA ||--o{ HOTSPOT : contains

  QUIZ ||--o{ QUESTION : contains
  QUIZ ||--o{ QUIZ_ATTEMPT : attempted_via

  QUIZ_ATTEMPT }o--|| USER : belongs_to
  QUIZ_ATTEMPT }o--|| QUIZ : for

  USER_ACHIEVEMENT }o--|| USER : belongs_to
  USER_ACHIEVEMENT }o--|| ACHIEVEMENT : references

  REPORT ||--o| REPORT_RESPONSE : receives

  CHAT_SESSION ||--o{ CHAT_MESSAGE : contains

  USER {
    uuid id PK
    string email UK
    string password_hash
    string display_name
    string avatar_url
    enum language
    enum role
    int total_xp
    int coin_balance
    timestamp created_at
  }
  PERSONALITY_PROFILE {
    uuid id PK
    uuid user_id FK
    enum personality_type
    int quizzes_counted
    int panoramas_counted
    int favorites_counted
    int interactions_counted
    timestamp assessed_at
  }
  CHALLENGE {
    uuid id PK
    uuid user_id FK
    enum personality_type
    string title
    string description
    int xp_reward
    int coin_reward
    int progress_current
    int progress_target
    uuid target_entity_id
    enum target_entity_type
    boolean is_completed
    timestamp created_at
    timestamp updated_at
    timestamp expires_at
  }
  CITY {
    uuid id PK
    string slug UK
    string name_en
    string name_ar
    string governorate
    string governorate_ar
    string description_en
    string description_ar
    string thumbnail_url
    float latitude
    float longitude
    enum status
    timestamp created_at
    timestamp updated_at
  }
  MONUMENT {
    uuid id PK
    uuid city_id FK
    string slug UK
    string name_en
    string name_ar
    string description_en
    string description_ar
    string subcategory
    float latitude
    float longitude
    string thumbnail_url
    string entry_fee
    string opening_hours
    string_array tags
    enum status
    timestamp created_at
    timestamp updated_at
  }
  CATEGORY {
    uuid id PK
    string slug UK
    string name_en
    string name_ar
    enum type
    timestamp created_at
    timestamp updated_at
  }
  PANORAMA {
    uuid id PK
    uuid monument_id FK
    string url_low
    string url_medium
    string url_high
    string narration_url_en
    string narration_url_ar
    json camera_bounds
    timestamp created_at
    timestamp updated_at
  }
  HOTSPOT {
    uuid id PK
    uuid panorama_id FK
    float pos_x
    float pos_y
    float pos_z
    string title_en
    string title_ar
    string body_en
    string body_ar
    string image_url
    timestamp created_at
    timestamp updated_at
  }
  MEDIA_ASSET {
    uuid id PK
    uuid entity_id FK
    enum entity_type
    enum asset_type
    string url
    string caption_en
    string caption_ar
    timestamp created_at
    timestamp updated_at
  }
  TIMELINE_EVENT {
    uuid id PK
    uuid city_id FK
    string title_en
    string title_ar
    string description_en
    string description_ar
    string image_url
    int year "Negative for BCE, positive for CE"
    string era
    int display_order
    timestamp created_at
    timestamp updated_at
  }
  AWARENESS_CARD {
    uuid id PK
    uuid entity_id FK
    enum entity_type
    enum card_type
    string body_en
    string body_ar
    timestamp created_at
    timestamp updated_at
  }
  QUIZ {
    uuid id PK
    uuid entity_id FK
    enum entity_type
    enum difficulty
    int question_count
    timestamp created_at
  }
  QUESTION {
    uuid id PK
    uuid quiz_id FK
    enum question_type
    string prompt_en
    string prompt_ar
    json choices
    string correct_answer
    string explanation_en
    string explanation_ar
    enum difficulty
  }
  QUIZ_ATTEMPT {
    uuid id PK
    uuid user_id FK
    uuid quiz_id FK
    int score
    int max_score
    enum difficulty_used
    boolean passed
    int attempt_number
    timestamp completed_at
    unique user_id_quiz_id_attempt_number UK
  }
  ACHIEVEMENT {
    uuid id PK
    string name_en
    string name_ar
    string description_en
    string icon_url
    enum achievement_type
    json unlock_criteria
    int xp_reward
  }
  USER_ACHIEVEMENT {
    uuid id PK
    uuid user_id FK
    uuid achievement_id FK
    timestamp earned_at
    unique user_id_achievement_id UK
  }
  XP_TRANSACTION {
    uuid id PK
    uuid user_id FK
    int xp_amount
    int coin_amount
    enum source_type
    uuid source_id
    timestamp created_at
  }
  FAVORITE {
    uuid id PK
    uuid user_id FK
    uuid entity_id FK
    enum entity_type
    timestamp created_at
    unique user_id_entity_id_entity_type UK
  }
  RATING {
    uuid id PK
    uuid user_id FK
    uuid entity_id FK
    enum entity_type
    int stars
    timestamp updated_at
    unique user_id_entity_id_entity_type UK
  }
  REPORT {
    uuid id PK
    uuid user_id FK
    uuid entity_id FK
    enum entity_type
    enum reason
    string description
    enum status
    timestamp created_at
  }
  REPORT_RESPONSE {
    uuid id PK
    uuid report_id FK
    uuid admin_user_id FK
    string message
    timestamp created_at
  }
  CHAT_SESSION {
    uuid id PK
    uuid user_id FK
    timestamp started_at
    timestamp last_active_at
  }
  CHAT_MESSAGE {
    uuid id PK
    uuid session_id FK
    enum role
    text content
    timestamp created_at
  }
  RECOMMENDATION_SNAPSHOT {
    uuid id PK
    uuid user_id FK
    json recommendations
    timestamp generated_at
  }
  USER_INTERACTION {
    uuid id PK
    uuid user_id FK
    uuid entity_id FK
    enum entity_type
    enum action_type
    int duration_seconds
    timestamp created_at
  }
  NOTIFICATION {
    uuid id PK
    uuid user_id FK
    enum notification_type
    string title
    string body
    boolean is_read
    uuid source_id
    timestamp created_at
  }