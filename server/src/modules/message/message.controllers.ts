import { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import MessageService from "./message.services";

class MessageController {
  constructor(private readonly messageService: MessageService) {}

  createMessage = catchAsync(async (req: Request, res: Response) => {
    const { conversationId, content } = req.body;
    const senderId = req.user?.id as string; // Assuming user is attached to request

    const message = await this.messageService.createMessage({
      conversationId,
      senderId,
      body: content,
    });

    res.status(201).json(ApiResponse.success(message));
  });

  getMessagesByConversation = catchAsync(
    async (req: Request, res: Response) => {
      const { conversationId } = req.params;

      const messages =
        await this.messageService.getMessagesByConversation(
          conversationId as string
        );

      res.status(200).json(ApiResponse.success(messages));
    },
  );

  getMessageById = catchAsync(async (req: Request, res: Response) => {
    const { messageId } = req.params;

    const message = await this.messageService.getMessageById(
      messageId as string,
    );

    res.status(200).json(ApiResponse.success(message));
  });

  updateMessage = catchAsync(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await this.messageService.updateMessage(
      messageId as string,
      content,
    );

    res.status(200).json(ApiResponse.success(message));
  });

  deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const { messageId } = req.params;

    // await this.messageService.deleteMessage(messageId);

    res.status(204).send();
  });
}

export default MessageController;
