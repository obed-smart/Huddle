import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import CallService from "./call.services";

class CallControllers {
  constructor(private readonly callService: CallService) {}

  getCallLOgs = catchAsync(async (req, res) => {
    const userId = req.user?.id as string;
    const cursor = req.query.cursor as string | undefined;

    const { callLOg, nextCursor } = await this.callService.getCallLog(
      userId,
      cursor,
    );

    res.status(200).json(ApiResponse.success({ callLOg, nextCursor }));
  });

  getActiveCallsForUsers = catchAsync(async (req, res) => {
    const userId = req.user?.id as string;

    const calls = this.callService.getActiveCallsForUsers(userId);

    res.status(200).json(ApiResponse.success(calls));
  });
}

export default CallControllers;
