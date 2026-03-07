import { useEffect, useState } from "react";
import { StreamVideoClient, User } from "@stream-io/video-react-sdk";

let videoClient: StreamVideoClient | null = null;

export function useVideoClient() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initVideo() {
      try {
        const res = await fetch("/api/video/token", {
          method: "POST",
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (!videoClient) {
          const user: User = {
            id: data.userId,
            name: data.userName,
          };

          videoClient = new StreamVideoClient({
            apiKey: data.apiKey,
            user,
            token: data.token,
          });
        }

        setClient(videoClient);
        setIsLoading(false);
      } catch (error) {
        console.error("Video client init error:", error);
        setIsLoading(false);
      }
    }

    initVideo();

    return () => {
      cancelled = true;
    };
  }, []);

  return { client, isLoading };
}
