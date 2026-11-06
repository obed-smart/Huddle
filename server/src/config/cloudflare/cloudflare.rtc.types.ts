// cloudflare-rtc.types.ts
export type SessionDescription = {
  type: "offer" | "answer";
  sdp: string;
};

export type TrackRequest = {
  location: "local" | "remote";
  trackName: string;
  mid?: string;
  sessionId?: string;
};

export type AddTracksBody = {
  sessionDescription?: SessionDescription;
  tracks: TrackRequest[];
};

export type AddTracksResponse = {
  sessionDescription?: SessionDescription;
  requiresImmediateRenegotiation?: boolean;
  tracks?: Array<{
    trackName: string;
    mid?: string;
    errorCode?: string;
    errorDescription?: string;
  }>;
  errorCode?: string;
  errorDescription?: string;
};

export type RenegotiateResponse = {
  errorCode?: string;
  errorDescription?: string;
};

export type CloseTracksResponse = {
  sessionDescription?: SessionDescription;
  requiresImmediateRenegotiation?: boolean;
  tracks?: Array<{
    mid: string;
    errorCode?: string;
    errorDescription?: string;
  }>;
};

export type CfIceServer = {
  urls: string[];
  username: string;
  credential: string;
};

export type CfTurnResponse = {
  iceServers: CfIceServer[];
};
