import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  // AudioSession,
  AudioTrack,
  VideoTrack,
  useTracks,
  useRoomContext,
  isTrackReference,
} from "@livekit/components-react";
import { createLocalAudioTrack, createLocalVideoTrack, Track } from "livekit-client";




function Streaming() {
  const [wsUrl, setWsUrl] = useState("");
  const [token, setToken] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState("");
  const [webSocket, setWebSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);




  // const room = useRoomContext(); // Call the hook here
  // useEffect(() => {
  //   console.log("Room context:", room);
  // }, [room]);







  const API_CONFIG = {

    apiKey: "OTNlZWQ1NmQ2OWRjNGVkNDliM2RiMzQxNzJjZDhhOTUtMTY3MzkwNjI0NQ==",
    serverUrl: "https://api.heygen.com",
  };


  const getSessionToken = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.serverUrl}/v1/streaming.create_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": API_CONFIG.apiKey,
          },
        }
      );
      const data = await response.json();
      return data.data.token;
    } catch (error) {
      console.error("Error getting session token:", error);
    }
  };

  const startStreamingSession = async (sessionId, sessionToken) => {
    try {
      const startResponse = await fetch(
        `${API_CONFIG.serverUrl}/v1/streaming.start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        }
      );
      const startData = await startResponse.json();
      if (startData) {
        setConnected(true);
      }
    } catch (error) {
      console.error("Error starting streaming session:", error);
    }
  };



  const createSession = async () => {
    try {
      setLoading(true);

      const newSessionToken = await getSessionToken();
      setSessionToken(newSessionToken);

      const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newSessionToken}`,
        },
        body: JSON.stringify({
          quality: "high",
          avatar_name: "",
          voice: { voice_id: "" },
          version: "v2",
          video_encoding: "H264",
        }),
      });

      const data = await response.json();
      console.log("Streaming new response:", data.data);

      if (data.data) {
        const newSessionId = data.data.session_id;
        setSessionId(newSessionId);
        setWsUrl(data.data.url);
        setToken(data.data.access_token);

        const params = new URLSearchParams({
          session_id: newSessionId,
          session_token: newSessionToken,
          silence_response: "false",
          stt_language: "en",
        });

        const wsUrl = `wss://${new URL(API_CONFIG.serverUrl).hostname}/v1/ws/streaming.chat?${params}`;
        const ws = new WebSocket(wsUrl);

        setWebSocket(ws);
        await startStreamingSession(newSessionId, newSessionToken);
      }
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendText = async () => {
    try {
      setSpeaking(true);

      const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text,
          task_type: "talk",
        }),
      });

      const data = await response.json();
      console.log("Task response:", data);
      setText("");
    } catch (error) {
      console.error("Error sending text:", error);
    } finally {
      setSpeaking(false);
    }
  };

  const closeSession = async () => {
    try {
      setLoading(true);
      if (!sessionId || !sessionToken) {
        console.log("No active session");
        return;
      }

      await fetch(`${API_CONFIG.serverUrl}/v1/streaming.stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (webSocket) {
        webSocket.close();
        setWebSocket(null);
      }

      setConnected(false);
      setSessionId("");
      setSessionToken("");
      setWsUrl("");
      setToken("");
      setText("");
      setSpeaking(false);

      console.log("Session closed successfully");
    } catch (error) {
      console.error("Error closing session:", error);
    } finally {
      setLoading(false);
    }
  };




  if (!connected) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
        <h1 className="text-lg font-semibold"> HeyGen Streaming API + LiveKit</h1>
        <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          onClick={createSession} disabled={loading}>
          {loading ? "Starting..." : "Start Session"}
        </button>
      </div>
    );
  }


  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connect={true}>
      <RoomView text={text} setText={setText} />

      <button
        onClick={sendText}
        disabled={speaking}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {speaking ? "Speaking..." : "Send Text"}
      </button>


      <button
        onClick={closeSession}
        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Close Session
      </button>


      {/* <AudioComponent/> */}

      {/* {tracks.map((track) => (
        <AudioTrack key={track.sid} track={track} />
      ))} */}

    </LiveKitRoom>
  );
}


const RoomView = ({ text, setText }) => {


  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });

  const room = useRoomContext(); // Call the hook here
  const isConnected = room.state === "connected";

  useEffect(() => {
    console.log("Room context:", room);
  }, [room]); // Only runs when room changes

  
  useEffect(() => {
    const publishTracks = async () => {
      if (!room.localParticipant) return;
  
      try {
        const micTrack = await createLocalAudioTrack();
        const camTrack = await createLocalVideoTrack();
  
        await room.localParticipant.publishTrack(micTrack);
        await room.localParticipant.publishTrack(camTrack);
  
        console.log("✅ Tracks Published!");
      } catch (error) {
        console.error("🚨 Error publishing track:", error);
      }
    };
  
    publishTracks();
  }, [room.localParticipant]);



  useEffect(() => {
    console.log("🔍 Local Participant Tracks:", room.localParticipant?.tracks);
  }, [room.localParticipant?.tracks]);


  
  const AudioPlayer = () => {

  //   const { tracks } = isConnected
  // ? useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio])
  // : { tracks: [] };

    const { tracks } = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio]);
    console.log('tracks are =', tracks);
    console.log('Room Connected =', isConnected);

    useEffect(() => {
      if (!Array.isArray(tracks)) return; // Ensure tracks is an array before using forEach

      tracks.forEach(({ track }) => {
        if (track.kind === "audio") {
          console.log('track kind =', track.kind);
          console.log('track =', track);
          const audioElement = track.attach();
          document.body.appendChild(audioElement); // Append to body for playback
        }
      });


      return () => {
        tracks.forEach(({ track }) => track.detach());
      };
    }, [tracks]);

    return null;
  };



  return (
    <div className="room-container">
      <div className="video-container">
        {tracks.map((track, idx) =>
          isTrackReference(track) ? (
            <VideoTrack key={idx} trackRef={track} objectFit="contain" />
          ) : null
        )}
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
        className="w-full px-4 py-2 border rounded"
      />

      <AudioPlayer />


    </div>
  );
};


export default Streaming;





// const AudioComponent = () => {
//   const room = useRoomContext();

//   useEffect(() => {
//     const setupAudio = async () => {
//       await room.localParticipant.setMicrophoneEnabled(true);
//     };

//     setupAudio();
//     return () => {
//       room.localParticipant.setMicrophoneEnabled(false);
//     };
//   }, [room]);

//   const tracks = useTracks([{ source: "microphone" }]);
//   console.log("Audio tracks:", tracks);

//   return (
//     <>
//       {tracks.map((track) => (
//         <AudioTrack key={track.sid} track={track} />
//       ))}
//     </>
//   );
// };



//  // Start audio session on app launch
//  useEffect(() => {
//   const setupAudio = async () => {
//     await AudioSession.startAudioSession();
//   };

//   setupAudio();
//   return () => {
//     AudioSession.stopAudioSession();
//   };
// }, []);


// const roomRef = useRef(null);

// useEffect(() => {
//   if (roomRef.current) {
//     const room = roomRef.current.room;
//     const setupAudio = async () => {
//       await room.localParticipant.setMicrophoneEnabled(true);
//     };

//     setupAudio();
//     return () => {
//       room.localParticipant.setMicrophoneEnabled(false);
//     };
//   }
// }, []);

// const tracks = useTracks([{ source: "microphone" }]);

