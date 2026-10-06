import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import MeetService from "./meet.services";

class MeetController {
  constructor(private readonly meetService: MeetService) {}

  createMeet = catchAsync(async (req, res) => {
    const { conversationId, title, scheduledFor } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const meet = await this.meetService.createMeet({
      conversationId,
      createdBy: userId,
      title,
      scheduledFor,
    });

    return res
      .status(201)
      .json(ApiResponse.success(meet));
  });

  getActiveMeetsForUsers = catchAsync(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const meets = this.meetService.getActiveMeetsForUsers(userId);

    return res.status(200).json(ApiResponse.success(meets));
  });
}

export default MeetController;
