export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INewMessage {
  conversationId: string;
  senderId: string;
  content: string;
}
