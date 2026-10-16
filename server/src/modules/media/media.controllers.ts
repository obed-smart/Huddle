import AppError from "../../shared/utils/apiError";
import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import MediaService from "./media.services";

class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  getPresignedUrl = catchAsync(async (req, res) => {
    const user = req.user;
    const { files } = req.body;

    if (!user) {
      throw new AppError("Unauthorized: Invalid session", 401);
    }

    const result = await this.mediaService.getPresignedUrls(user.id, files);

    res.status(200).json(ApiResponse.success(result));
  });

  getMessageAttachmentUrl = catchAsync(async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      throw new AppError("Unauthorized: Invalid session", 401);
    }

    if (typeof id !== "string") {
      throw new AppError("Invalid attachment ID", 400);
    }

    const url = await this.mediaService.getMessageAttachmentUrl(id, user.id);

    res.status(200).json(ApiResponse.success(url));
  });
}

export default MediaController;
