import MediaRepository from "./media.repository";

class MediaService {
  constructor(private readonly mediaRepo: MediaRepository) {}
}

export default MediaService;
