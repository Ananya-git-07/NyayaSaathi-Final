import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff,
  Radio, MessageSquare, Users, Settings, X, Hand, Wifi, WifiOff,
  Maximize2, Clock
} from "lucide-react";
import apiClient from "../api/axiosConfig";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const VideoCallPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false); // User hasn't joined yet
  const [callStatus, setCallStatus] = useState("connecting"); // connecting, connected, ended
  
  // Media states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  
  // Recording
  const [recording, setRecording] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  
  // Chat
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  
  // New features
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState("excellent"); // excellent, good, poor
  const [showParticipants, setShowParticipants] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [remoteHandRaised, setRemoteHandRaised] = useState(false);
  const [isPiPMode, setIsPiPMode] = useState(false);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const callStartTimeRef = useRef(null);
  const socketRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const sessionRef = useRef(null);
  const peerConnectionInitializedRef = useRef(false);
  const isCreatingOfferRef = useRef(false);
  const processedUserJoinedRef = useRef(new Set());

  useEffect(() => {
    const init = async () => {
      const sessionData = await fetchSession();
      if (sessionData) {
        initializeSocket(sessionData);
        // Don't auto-initialize media - wait for user to click Join
      }
    };
    
    init();
    
    return () => {
      cleanup();
    };
  }, [sessionId]);

  // Close chat with Escape key and clear unread when opened
  useEffect(() => {
    if (!showChat) return;
    
    // Clear unread count when chat is opened
    setUnreadCount(0);
    
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowChat(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showChat]);

  // Call duration timer
  useEffect(() => {
    if (callStatus !== "connected") return;
    
    callStartTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDuration(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [callStatus]);

  // Monitor connection quality
  useEffect(() => {
    if (!peerConnectionRef.current) return;
    
    const interval = setInterval(async () => {
      try {
        const stats = await peerConnectionRef.current.getStats();
        let totalPacketsLost = 0;
        let totalPackets = 0;
        
        stats.forEach(report => {
          if (report.type === 'inbound-rtp') {
            totalPacketsLost += report.packetsLost || 0;
            totalPackets += report.packetsReceived || 0;
          }
        });
        
        const lossRate = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;
        
        if (lossRate < 2) setConnectionQuality("excellent");
        else if (lossRate < 5) setConnectionQuality("good");
        else setConnectionQuality("poor");
      } catch (error) {
        console.error("Error checking connection quality:", error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [peerConnectionRef.current]);

  // Handle PiP events
  useEffect(() => {
    const handleEnterPiP = () => setIsPiPMode(true);
    const handleLeavePiP = () => setIsPiPMode(false);
    
    const videoElement = remoteVideoRef.current;
    if (videoElement) {
      videoElement.addEventListener('enterpictureinpicture', handleEnterPiP);
      videoElement.addEventListener('leavepictureinpicture', handleLeavePiP);
      
      return () => {
        videoElement.removeEventListener('enterpictureinpicture', handleEnterPiP);
        videoElement.removeEventListener('leavepictureinpicture', handleLeavePiP);
      };
    }
  }, [remoteVideoRef.current]);

  // Attach remote stream to video element when available
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('🔄 Attaching remote stream to video element via useEffect');
      
      const videoTracks = remoteStream.getVideoTracks();
      const audioTracks = remoteStream.getAudioTracks();
      const hasActiveVideo = videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState === 'live';
      
      console.log('📊 Remote stream info:', {
        id: remoteStream.id,
        active: remoteStream.active,
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        hasActiveVideo,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted
        }))
      });
      
      setHasRemoteVideo(hasActiveVideo);
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force video element properties
      remoteVideoRef.current.muted = false; // Ensure audio plays
      remoteVideoRef.current.volume = 1.0;
      
      remoteVideoRef.current.play().catch(e => {
        console.error('Failed to play remote video:', e);
        // Try again with user interaction
        const playAttempt = () => {
          remoteVideoRef.current?.play().then(() => {
            console.log('✅ Remote video playing after retry');
            document.removeEventListener('click', playAttempt);
          });
        };
        document.addEventListener('click', playAttempt, { once: true });
      });
    }
  }, [remoteStream]);

  const fetchSession = async () => {
    try {
      const response = await apiClient.get(`/videosessions/sessions/${sessionId}`);
      const sessionData = response.data.data;
      setSession(sessionData);
      sessionRef.current = sessionData; // Store in ref for socket handlers
      setLoading(false);
      return sessionData;
    } catch (error) {
      toast.error("Failed to load session");
      navigate("/dashboard");
      throw error;
    }
  };

  const initializeSocket = (sessionData) => {
    if (socketRef.current) {
      console.log('Socket already exists, skipping initialization');
      return;
    }
    
    // Extract base URL without /api suffix
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const socketUrl = apiUrl.replace('/api', '');
    
    console.log('Initializing socket to:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
      
      // Join video room when socket connects
      if (sessionData && sessionData.roomId) {
        console.log('📞 Joining video room:', sessionData.roomId);
        socketRef.current.emit('join_video_room', {
          roomId: sessionData.roomId,
          userId: user._id
        });
      } else {
        console.error('❌ Cannot join room - no session data');
      }
    });

    // Handle other user joining
    socketRef.current.on('user_joined', async ({ userId, socketId }) => {
      // Prevent duplicate processing of same user join
      const joinKey = `${userId}-${socketId}`;
      if (processedUserJoinedRef.current.has(joinKey)) {
        console.log('⏭️ Skipping duplicate user_joined event for:', userId);
        return;
      }
      processedUserJoinedRef.current.add(joinKey);
      
      console.log('👤 User joined:', userId, 'Socket:', socketId);
      remoteSocketIdRef.current = socketId;
      toast.success('Other participant joined');
      
      // Create and send offer if we have local stream and peer connection
      if (localStreamRef.current && peerConnectionRef.current && !isCreatingOfferRef.current) {
        console.log('📤 Creating offer for new participant');
        console.log('Local stream tracks:', localStreamRef.current.getTracks().map(t => t.kind));
        setTimeout(() => createAndSendOffer(socketId), 500);
      } else {
        console.log('⏳ Waiting for local stream before creating offer');
        console.log('Local stream exists:', !!localStreamRef.current);
        console.log('Peer connection exists:', !!peerConnectionRef.current);
        console.log('Already creating offer:', isCreatingOfferRef.current);
      }
    });

    // Handle receiving offer
    socketRef.current.on('video_offer', async ({ offer, senderSocketId }) => {
      console.log('📥 Received offer from:', senderSocketId);
      remoteSocketIdRef.current = senderSocketId;
      await handleReceiveOffer(offer, senderSocketId);
    });

    // Handle receiving answer
    socketRef.current.on('video_answer', async ({ answer, senderSocketId }) => {
      console.log('📥 Received answer from:', senderSocketId);
      await handleReceiveAnswer(answer);
    });

    // Handle ICE candidates
    socketRef.current.on('ice_candidate', async ({ candidate, senderSocketId }) => {
      console.log('🧊 Received ICE candidate');
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ ICE candidate added');
        } catch (error) {
          console.error('❌ Error adding ICE candidate:', error);
        }
      }
    });

    // Handle user leaving
    socketRef.current.on('user_left', ({ userId }) => {
      console.log('👋 User left:', userId);
      toast('Other participant left the call', { icon: '👋' });
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    // Handle hand raise from other participant
    socketRef.current.on('hand_raised', ({ userId, raised }) => {
      console.log('✋ Hand raise event:', userId, raised);
      setRemoteHandRaised(raised);
      if (raised) {
        toast('Participant raised their hand', { icon: '✋' });
      }
    });

    // Handle recording consent change from citizen
    socketRef.current.on('consent_changed', ({ consent }) => {
      console.log('📝 Recording consent changed:', consent);
      setRecordingConsent(consent);
      if (consent) {
        toast.success('Citizen has given recording consent');
      } else {
        toast('Citizen has revoked recording consent', { icon: '⚠️' });
      }
    });

    // Handle incoming chat messages
    socketRef.current.on('chat_message', ({ message, sender, timestamp }) => {
      console.log('💬 Received chat message:', message);
      setMessages(prev => [...prev, { text: message, sender, timestamp: new Date(timestamp) }]);
      // Increment unread count only if chat is closed
      setUnreadCount(prev => prev + 1);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
  };

  const initializeMedia = async () => {
    try {
      // Check available devices first
      let hasCamera = false;
      let hasMicrophone = false;
      
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasCamera = devices.some(device => device.kind === 'videoinput');
        hasMicrophone = devices.some(device => device.kind === 'audioinput');
        console.log('📹 Available devices - Camera:', hasCamera, 'Microphone:', hasMicrophone);
      } catch (err) {
        console.warn('Could not enumerate devices:', err);
      }
      
      let stream = null;
      
      // Try multiple fallback strategies
      const strategies = hasCamera ? [
        // Strategy 1: Ideal quality
        { 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        },
        // Strategy 2: Basic quality
        { video: true, audio: true },
        // Strategy 3: Any available device
        { video: { facingMode: 'user' }, audio: true }
      ] : [
        // Audio only if no camera
        { video: false, audio: true }
      ];

      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`Trying media strategy ${i + 1}...`);
          stream = await navigator.mediaDevices.getUserMedia(strategies[i]);
          
          // Check if we got video track
          const hasVideo = stream.getVideoTracks().length > 0;
          const hasAudio = stream.getAudioTracks().length > 0;
          
          console.log(`✅ Strategy ${i + 1} succeeded - Video: ${hasVideo}, Audio: ${hasAudio}`);
          
          if (!hasVideo && hasAudio) {
            toast('No camera found. Proceeding with audio only.', { icon: '🎤' });
            setVideoEnabled(false);
          } else if (!hasVideo) {
            console.warn('No video track in stream');
            setVideoEnabled(false);
          }
          
          break; // Success!
        } catch (err) {
          console.warn(`Strategy ${i + 1} failed:`, err.message);
          if (i === strategies.length - 1) {
            throw err; // All strategies failed
          }
        }
      }

      if (!stream) {
        throw new Error('Unable to get media stream');
      }
      
      setLocalStream(stream);
      localStreamRef.current = stream; // Store in ref for socket handlers
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Mark as ready and start the session
      setIsReady(true);
      await apiClient.patch(`/videosessions/sessions/${sessionId}/start`);
      setCallStatus("connected");
      
      // Initialize WebRTC peer connection
      initializePeerConnection(stream);
      
      // If remote participant already joined, create offer
      if (remoteSocketIdRef.current && peerConnectionRef.current) {
        console.log('🔄 Remote participant already present, creating offer');
        await createAndSendOffer(remoteSocketIdRef.current);
      }
    } catch (error) {
      console.error('Media initialization error:', error);
      if (error.name === 'NotFoundError') {
        toast.error("No camera or microphone found. Please connect a device and refresh.");
      } else if (error.name === 'NotAllowedError') {
        toast.error("Camera/microphone access denied. Please allow access in your browser settings.");
      } else if (error.name === 'NotReadableError') {
        toast.error("Device is already in use by another application.");
      } else {
        toast.error("Failed to access media devices: " + error.message);
      }
      // Don't navigate away - let user see the error and try again
    }
  };

  const initializePeerConnection = (stream) => {
    // Prevent duplicate peer connection creation
    if (peerConnectionInitializedRef.current) {
      console.log('⏭️ Peer connection already initialized, skipping');
      return;
    }
    peerConnectionInitializedRef.current = true;
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    
    console.log('🔧 Creating peer connection');
    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log('➕ Added track to peer connection:', track.kind);
    });
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('🎥 Received remote track:', event.track.kind);
      console.log('Track details:', {
        id: event.track.id,
        kind: event.track.kind,
        label: event.track.label,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState
      });
      console.log('Remote streams:', event.streams);
      
      const remoteStream = event.streams[0];
      if (!remoteStream) {
        console.error('❌ No stream in track event');
        return;
      }
      
      console.log('Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}: ${t.readyState}`));
      
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log('✅ Remote video attached to element');
        
        // Force play
        remoteVideoRef.current.play().catch(e => {
          console.error('Failed to play remote video:', e);
        });
      } else {
        console.error('❌ Remote video ref not available');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && sessionRef.current) {
        console.log('🧊 Sending ICE candidate');
        socketRef.current.emit('ice_candidate', {
          roomId: sessionRef.current.roomId,
          candidate: event.candidate,
          targetSocketId: remoteSocketIdRef.current
        });
      } else if (!event.candidate) {
        console.log('🧊 ICE gathering complete');
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        toast.success('Video call connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        toast.error('Connection lost');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
    };
    
    peerConnectionRef.current = pc;
    console.log('✅ Peer connection created');

    // Join the video room if socket is connected
    if (socketRef.current && socketRef.current.connected && sessionRef.current && sessionRef.current.roomId) {
      console.log('📞 Joining video room from peer connection:', sessionRef.current.roomId);
      socketRef.current.emit('join_video_room', {
        roomId: sessionRef.current.roomId,
        userId: user._id
      });
    }
  };

  const createAndSendOffer = async (targetSocketId) => {
    // Prevent concurrent offer creation
    if (isCreatingOfferRef.current) {
      console.log('⏭️ Already creating offer, skipping');
      return;
    }
    isCreatingOfferRef.current = true;
    
    try {
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection available');
        return;
      }

      if (!sessionRef.current) {
        console.error('❌ No session data available');
        return;
      }

      console.log('📤 Creating offer...');
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('✅ Local description set');
      
      console.log('📤 Sending offer to:', targetSocketId);
      socketRef.current.emit('video_offer', {
        roomId: sessionRef.current.roomId,
        offer: offer,
        targetSocketId: targetSocketId
      });
      console.log('✅ Offer sent');
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      toast.error('Failed to create video offer');
    } finally {
      isCreatingOfferRef.current = false;
    }
  };

  const handleReceiveOffer = async (offer, senderSocketId) => {
    try {
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection available');
        return;
      }

      if (!sessionRef.current) {
        console.error('❌ No session data available');
        return;
      }

      console.log('📥 Setting remote description from offer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description set');
      
      console.log('📤 Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('✅ Local description (answer) set');
      
      console.log('📤 Sending answer to:', senderSocketId);
      socketRef.current.emit('video_answer', {
        roomId: sessionRef.current.roomId,
        answer: answer,
        targetSocketId: senderSocketId
      });
      console.log('✅ Answer sent');
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      toast.error('Failed to handle video offer');
    }
  };

  const handleReceiveAnswer = async (answer) => {
    try {
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection available');
        return;
      }

      console.log('📥 Setting remote description from answer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Remote description (answer) set - connection should establish');
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      toast.error('Failed to handle video answer');
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        // Replace video track with screen share
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setScreenSharing(true);
        toast.success("Screen sharing started");
      } catch (error) {
        toast.error("Failed to start screen sharing");
      }
    } else {
      // Switch back to camera
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find(s => s.track?.kind === 'video');
      
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
      
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      
      setScreenSharing(false);
      toast.success("Screen sharing stopped");
    }
  };

  const startRecording = async () => {
    if (!recordingConsent) {
      if (user.role === 'citizen') {
        toast.error("Please give recording consent first");
      } else {
        toast.error("Citizen must give consent before recording can start");
      }
      return;
    }
    
    if (!localStreamRef.current) {
      toast.error("No local stream available to record");
      return;
    }
    
    try {
      // Update consent in backend
      await apiClient.patch(`/videosessions/sessions/${sessionId}/consent`, {
        consent: true,
      });
      
      // Combine local and remote streams
      const tracks = [...(localStreamRef.current?.getTracks() || [])];
      if (remoteStream) {
        tracks.push(...remoteStream.getTracks());
      }
      
      const combinedStream = new MediaStream(tracks);
      
      console.log('🎥 Starting recording with tracks:', tracks.map(t => `${t.kind} (${t.label})`));
      
      // Check which codec is supported
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        console.warn('VP8/Opus not supported, using default webm');
      }
      
      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log('📼 Recorded chunk:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `video-call-${sessionId}-${timestamp}.webm`;
        
        // Auto-download the recording
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        // TODO: In production, upload to cloud storage (S3, Cloudinary, etc.)
        // Example:
        // const formData = new FormData();
        // formData.append('video', blob, filename);
        // await apiClient.post(`/videosessions/sessions/${sessionId}/upload-recording`, formData);
        
        try {
          // Save recording metadata to session (for now just save that it exists)
          await apiClient.patch(`/videosessions/sessions/${sessionId}/recording`, {
            recordingUrl: filename, // In production, this would be the cloud storage URL
          });
        } catch (error) {
          console.error('Failed to save recording metadata:', error);
        }
        
        toast.success(`Recording saved and downloaded: ${filename}`);
        recordedChunksRef.current = [];
      };
      
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to start recording");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.success("Recording stopped");
    }
  };

  const endCall = async () => {
    try {
      if (recording) {
        stopRecording();
      }
      
      try {
        await apiClient.patch(`/videosessions/sessions/${sessionId}/end`, {
          notes: "Call completed",
        });
      } catch (apiError) {
        // If session is already ended or cannot be ended, just log and continue
        console.log('Session end API call failed (may already be ended):', apiError.message);
      }
      
      cleanup();
      setShowChat(false); // Close chat when call ends
      setCallStatus("ended");
      toast.success("Call ended");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error('Error ending call:', error);
      // Still try to cleanup and navigate
      cleanup();
      setCallStatus("ended");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current && socketRef.current.connected) {
      if (sessionRef.current) {
        socketRef.current.emit('leave_video_room', {
          roomId: sessionRef.current.roomId,
          userId: user._id
        });
      }
      socketRef.current.disconnect();
    }
    
    // Reset initialization flags
    peerConnectionInitializedRef.current = false;
    isCreatingOfferRef.current = false;
    processedUserJoinedRef.current.clear();
  };

  const formatCallDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRaiseHand = () => {
    const newHandRaisedState = !handRaised;
    setHandRaised(newHandRaisedState);
    
    // Send hand raise event to other participant
    if (socketRef.current && sessionRef.current) {
      socketRef.current.emit('raise_hand', {
        roomId: sessionRef.current.roomId,
        userId: user._id,
        raised: newHandRaisedState
      });
      console.log('✋ Sent hand raise event:', newHandRaisedState);
    }
    
    toast.success(newHandRaisedState ? "Hand raised" : "Hand lowered");
  };

  const togglePiP = async () => {
    try {
      if (!document.pictureInPictureElement) {
        await remoteVideoRef.current?.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      toast.error("Picture-in-Picture not supported");
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current && sessionRef.current) {
      const messageData = {
        text: newMessage,
        sender: user.role,
        timestamp: new Date(),
      };
      
      // Add to local messages
      setMessages(prev => [...prev, messageData]);
      
      // Send to other participant via socket
      socketRef.current.emit('send_chat_message', {
        roomId: sessionRef.current.roomId,
        message: newMessage,
        sender: user.role,
        timestamp: messageData.timestamp.toISOString()
      });
      
      console.log('💬 Sent chat message:', newMessage);
      setNewMessage("");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (callStatus === "ended") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <PhoneOff className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Call Ended</h2>
          <p className="text-slate-400">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Show Join Call screen if user hasn't joined yet
  if (!isReady) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Video className="text-blue-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Video Consultation</h2>
              <p className="text-slate-400">
                {session?.status === 'in-progress' 
                  ? 'A consultation is in progress. Join now to participate.'
                  : 'Ready to start your video consultation?'}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">Participants</p>
                  <p className="text-xs text-slate-400">
                    You and {user.role === 'citizen' ? 'Paralegal' : 'Citizen'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">Scheduled Time</p>
                  <p className="text-xs text-slate-400">
                    {session?.scheduledTime ? new Date(session.scheduledTime).toLocaleString() : 'Now'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={initializeMedia}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Video size={20} />
              <span>Join Call</span>
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              Make sure your camera and microphone are ready
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <div className="relative w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover bg-slate-900"
                onLoadedMetadata={() => console.log('🎬 Remote video metadata loaded')}
                onPlay={() => console.log('▶️ Remote video playing')}
                onError={(e) => console.error('❌ Remote video error:', e)}
              />
              {/* Show placeholder if remote video track is not active or enabled */}
              {!hasRemoteVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="text-center">
                    <VideoOff className="text-slate-400 mx-auto mb-4" size={80} />
                    <p className="text-slate-400 text-lg">Participant's camera is off</p>
                    <p className="text-slate-500 text-sm mt-2">Audio only</p>
                  </div>
                </div>
              )}
              {remoteHandRaised && (
                <div className="absolute bottom-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                  <Hand size={20} />
                  <span className="font-medium">Hand Raised</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <div className="text-center">
                <Users className="text-slate-600 mx-auto mb-4" size={80} />
                <p className="text-slate-400 text-lg">Waiting for other participant...</p>
                <p className="text-slate-500 text-sm mt-2">
                  {callStatus === 'connected' ? 'Establishing connection...' : 'Connecting...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-slate-800 rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700">
          {localStream && videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <VideoOff className="text-slate-400 mx-auto mb-2" size={40} />
                <p className="text-slate-400 text-xs">
                  {localStream ? 'Video Off' : 'No Camera'}
                </p>
              </div>
            </div>
          )}
          {handRaised && (
            <div className="absolute bottom-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Hand size={14} />
              <span>You</span>
            </div>
          )}
        </div>

        {/* Participants Button */}
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <Users size={18} />
          <span className="text-sm font-medium">Participants</span>
        </button>

        {/* Recording Indicator */}
        {recording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
            <Radio className="animate-pulse" size={20} />
            <span className="font-medium">Recording</span>
          </div>
        )}

        {/* Session Info */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium text-sm">
                {user.role === 'citizen' ? 'Consultation with Paralegal' : 'Consultation with Citizen'}
              </span>
            </div>
            
            <div className="h-4 w-px bg-slate-600"></div>
            
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span className="font-mono text-sm">{formatCallDuration(callDuration)}</span>
            </div>
            
            <div className="h-4 w-px bg-slate-600"></div>
            
            <div className="flex items-center gap-1.5" title={`Connection: ${connectionQuality}`}>
              {connectionQuality === "excellent" && <Wifi size={14} className="text-green-400" />}
              {connectionQuality === "good" && <Wifi size={14} className="text-yellow-400" />}
              {connectionQuality === "poor" && <WifiOff size={14} className="text-red-400" />}
              <span className="text-xs capitalize">{connectionQuality}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {user.role === 'citizen' ? (
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordingConsent}
                  onChange={(e) => {
                    const consent = e.target.checked;
                    setRecordingConsent(consent);
                    // Notify paralegal about consent change
                    if (socketRef.current && sessionRef.current) {
                      socketRef.current.emit('change_consent', {
                        roomId: sessionRef.current.roomId,
                        consent: consent
                      });
                    }
                  }}
                  className="rounded"
                />
                Give Recording Consent
              </label>
            ) : (
              <div className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={recordingConsent}
                  disabled
                  className="rounded opacity-50"
                />
                <span className="text-slate-400">
                  {recordingConsent ? 'Citizen has given consent ✓' : 'Waiting for citizen consent...'}
                </span>
              </div>
            )}
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                videoEnabled
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {videoEnabled ? (
                <Video className="text-white" size={24} />
              ) : (
                <VideoOff className="text-white" size={24} />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                audioEnabled
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {audioEnabled ? (
                <Mic className="text-white" size={24} />
              ) : (
                <MicOff className="text-white" size={24} />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
            >
              <PhoneOff className="text-white" size={28} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                screenSharing
                  ? "bg-cyan-500 hover:bg-cyan-600"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {screenSharing ? (
                <MonitorOff className="text-white" size={24} />
              ) : (
                <Monitor className="text-white" size={24} />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: recordingConsent ? 1.1 : 1 }}
              whileTap={{ scale: recordingConsent ? 0.9 : 1 }}
              onClick={recording ? stopRecording : startRecording}
              disabled={!recordingConsent}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                recording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-slate-700 hover:bg-slate-600"
              } ${!recordingConsent ? "opacity-50 cursor-not-allowed" : ""}`}
              title={user.role === 'citizen' 
                ? (!recordingConsent ? "Give consent first to enable recording" : recording ? "Stop recording" : "Start recording")
                : (!recordingConsent ? "Waiting for citizen consent" : recording ? "Stop recording" : "Start recording")
              }
            >
              <Radio className="text-white" size={24} />
            </motion.button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleRaiseHand}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                handRaised
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
              title={handRaised ? "Lower hand" : "Raise hand"}
            >
              <Hand className="text-white" size={24} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePiP}
              className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
              title="Picture-in-Picture"
            >
              <Maximize2 className="text-white" size={24} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowChat(!showChat)}
              className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center relative"
            >
              <MessageSquare className="text-white" size={24} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <>
          <div
            onClick={() => setShowChat(false)}
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
          />
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-slate-800 shadow-2xl flex flex-col z-50"
          >
          <div className="p-4 bg-slate-900 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Chat</h3>
              <p className="text-xs text-slate-400 mt-0.5">Press Esc to close</p>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === user.role ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === user.role
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white border-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </motion.div>
        </>
      )}

      {/* Participants Panel */}
      {showParticipants && (
        <>
          <div
            onClick={() => setShowParticipants(false)}
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
          />
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-slate-800 shadow-2xl flex flex-col z-50"
          >
            <div className="p-4 bg-slate-900 flex items-center justify-between border-b border-slate-700">
              <div>
                <h3 className="text-white font-semibold">Participants</h3>
                <p className="text-xs text-slate-400 mt-0.5">2 in call</p>
              </div>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Close participants"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Current User */}
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'Y'}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">You</p>
                      <p className="text-slate-400 text-xs capitalize">{user.role}</p>
                    </div>
                  </div>
                  {handRaised && (
                    <Hand size={18} className="text-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className={`flex items-center gap-1 ${videoEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {videoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                    <span>{videoEnabled ? 'Video On' : 'Video Off'}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${audioEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {audioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                    <span>{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
                  </div>
                </div>
              </div>

              {/* Other Participant */}
              {remoteStream && (
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {user.role === 'citizen' ? 'P' : 'C'}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {user.role === 'citizen' ? 'Paralegal' : 'Citizen'}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {user.role === 'citizen' ? 'Legal Assistant' : 'Client'}
                        </p>
                      </div>
                    </div>
                    {remoteHandRaised && (
                      <Hand size={18} className="text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-green-400">
                    <div className="flex items-center gap-1">
                      <Video size={14} />
                      <span>Video On</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mic size={14} />
                      <span>Audio On</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default VideoCallPage;
