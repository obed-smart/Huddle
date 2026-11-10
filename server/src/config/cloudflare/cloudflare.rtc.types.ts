// cloudflare-rtc.types.ts
export type SessionDescription = {
  type: "offer" | "answer";
  sdp: string;
};


export type LocalTrackRequest = {
  location: "local";
  trackName: string;
  mid: string;
};

export type RemoteTrackRequest = {
  location: "remote";
  sessionId: string;
  trackName: string;
  mid?: string;
};

export type TrackRequest = LocalTrackRequest | RemoteTrackRequest;


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


export type TrackResult = {
  trackName: string;
  sessionId?: string; 
  mid?: string;
  errorCode?: string;
  errorDescription?: string;
};

export type AddTracksResponse = {
  sessionDescription?: SessionDescription;
  requiresImmediateRenegotiation?: boolean;
  tracks?: TrackResult[];

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
