import ConversationsRepository from "./conversations.repository";

class ConversationService {
  constructor(
    private readonly conversationRepo: typeof ConversationsRepository,
  ) {}

  async createConversation(){
    
  }
}

export default ConversationService;
