/** TourBot Alexandria API — https://nondesigned-alexis-unpliantly.ngrok-free.dev/openapi.json */

export interface TourbotChatRequest {
  message: string;
  session_id?: string;
}

export interface TourbotChatResponse {
  answer: string;
  session_id: string;
}

export interface TourbotChatClient {
  sendMessage(sessionId: string, message: string): Promise<string>;
}
