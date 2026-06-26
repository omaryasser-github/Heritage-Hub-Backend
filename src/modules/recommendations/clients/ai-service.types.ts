import { InteractionActionType, InteractionEntityType, PersonalityType } from '@prisma/client';

export interface AiRecommendationItem {
  type: 'monument' | 'city';
  id: string;
  reason_en: string;
  reason_ar: string;
}

export interface AiRecentInteraction {
  action_type: InteractionActionType;
  entity_type: InteractionEntityType;
  entity_id: string;
}

export interface AiRecommendationsRequest {
  user_id: string;
  personality_type: PersonalityType | null;
  favorite_monument_ids: string[];
  favorite_city_ids: string[];
  recent_interactions: AiRecentInteraction[];
}

export interface AiRecommendationsResponse {
  items: AiRecommendationItem[];
}

export interface AiChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  session_id: string;
  user_id: string;
  message: string;
  history: AiChatHistoryMessage[];
}

export interface AiChatResponse {
  reply: string;
}

export interface AiServiceClient {
  getRecommendations(request: AiRecommendationsRequest): Promise<AiRecommendationsResponse>;
  getChatCompletion(request: AiChatRequest): Promise<AiChatResponse>;
}
