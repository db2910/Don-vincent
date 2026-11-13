export type YouTubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
};
type PlayerEvent = { target: YouTubePlayer };
export type YouTubeAPI = {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    host: string;
    width: number;
    height: number;
    playerVars: Record<string, string | number>;
    events: {
      onReady(event: PlayerEvent): void;
      onStateChange(event: PlayerEvent & { data: number }): void;
      onError(): void;
      onAutoplayBlocked(): void;
    };
  }) => YouTubePlayer;
};
declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YouTubeAPI> | null = null;

/** Load once, only after a guest requests music. A failed load can be retried. */
export function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YouTubeAPI>((resolve, reject) => {
    const script = document.createElement("script");
    const previousReady = window.onYouTubeIframeAPIReady;
    const cleanup = () => {
      clearTimeout(timeout);
      window.onYouTubeIframeAPIReady = previousReady;
    };
    const fail = () => {
      cleanup();
      script.remove();
      reject(new Error("YouTube could not load."));
    };
    const timeout = setTimeout(fail, 15_000);
    window.onYouTubeIframeAPIReady = () => {
      cleanup();
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else fail();
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => { loading = null; throw error; });
  return loading;
}
