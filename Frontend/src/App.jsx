import Router from "./router";
import { io } from "socket.io-client";
import SocketContext from "./utils/SocketContext";
import UserContext from "./utils/UserContext";
import { useCallback, useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getJWT } from "./utils/api";
import "./global.css";
import config from "./config";
import ConnectRoblox from "./components/Account/ConnectRoblox";
import { AnimatePresence } from "framer-motion";
import { LazyMotion, domAnimation } from "framer-motion";
import Cookies from "js-cookie";

export default function App() {
  const [userData, setUserData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [ConnectRobloxModal, setModalState] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [refreshType, setRefreshType] = useState('normal');
  const [isOptimistic, setIsOptimistic] = useState(false);
  const socketRef = useRef(null);
  const refreshStartTime = useRef(null);

  // Debug loading state changes
  useEffect(() => {
    console.log('🔍 Loading data state changed:', loadingData);
  }, [loadingData]);

  const handleBalanceUpdate = useCallback(
    (balance) => {
      setUserData({
        ...userData,
        balance: balance,
      });
    },
    [userData]
  );

  // Initialize socket when component mounts
  useEffect(() => {
    const token = getJWT();
    console.log("🔍 Initializing socket, token exists:", !!token);
    console.log("🔍 Token value:", token ? token.substring(0, 20) + "..." : "null");

    console.log("🔍 Creating socket connection...");
    const socketOptions = {
      reconnectionDelayMax: 10000,
      transports: ["websocket"],
    };

    // Only add auth if we have a token
    if (token) {
      socketOptions.auth = { token: token };
    }

    const newSocket = io(`${config.api}/`, socketOptions);

    // Add connection event listeners
    newSocket.on("connect", () => {
      console.log("✅ Frontend socket connected successfully");
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Frontend socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Frontend socket connection error:", error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    console.log("✅ Socket initialized", token ? "with token" : "without token");

    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket");
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Authentication and user data loading
  useEffect(() => {
    const initializeUser = async () => {
      console.log('🚀 App initialization - checking authentication');

      const token = getJWT();

      if (token) {
        try {
          console.log('🔐 JWT token found, fetching user data...');

          // Fetch authenticated user data
          const response = await fetch(`${config.api}/login-auto`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            cache: 'no-cache'
          });

          if (response.ok) {
            const userInfo = await response.json();
            console.log('✅ Authenticated user data loaded:', userInfo);
            setUserData(userInfo);
          } else {
            console.log('❌ Failed to fetch user data, falling back to guest');
            // Token invalid, create guest user
            createGuestUser();
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          createGuestUser();
        }
      } else {
        console.log('👤 No JWT token found, creating guest user');
        createGuestUser();
      }

      setLoadingProgress(100);

      console.log('🎉 User initialization complete');
      setLoadingData(false);

      // Hide the HTML loading screen immediately
      if (window.hideLoadingScreen) {
        window.hideLoadingScreen();
        console.log('✅ HTML loading screen hidden immediately');
      }
    };

    const createGuestUser = () => {
      const guestUser = {
        username: 'Guest',
        balance: 1000,
        level: 1,
        robloxId: null,
        deposited: 0,
        withdrawn: 0,
        wagered: 0,
        thumbnail: 'https://www.roblox.com/headshot-thumbnail/image?userId=1&width=420&height=420&format=png'
      };
      setUserData(guestUser);
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("BALANCE_UPDATE", handleBalanceUpdate);
      return () => {
        socket.off("BALANCE_UPDATE", handleBalanceUpdate);
      };
    }
  }, [socket, handleBalanceUpdate]);

  return (
    <>
      {/* Full-Screen Refresh Overlay */}
      {isRefreshing && (
        <div
          className="FullScreenRefreshOverlay"
          role="status"
          aria-live="polite"
          aria-label="Refreshing website"
        >
          <div className="FullScreenRefreshSpinner">
            <div className="FullScreenRefreshSpinnerInner"></div>
          </div>
          <p>Refreshing Website...</p>
        </div>
      )}

      {!loadingData && (
        <SocketContext.Provider value={socket}>
          <UserContext.Provider value={userData}>
            <LazyMotion features={domAnimation}>
              <Toaster
                toastOptions={{
                  style: {
                    padding: "16px",
                    color: "#fff",
                    background: "#120F22",
                  },
                  iconTheme: {
                    primary: "#863aff",
                    secondary: "#fff",
                  },
                }}
              />
              <AnimatePresence>
                {ConnectRobloxModal && ConnectRobloxModal}
              </AnimatePresence>
              <Router />
            </LazyMotion>
          </UserContext.Provider>
        </SocketContext.Provider>
      )}
    </>
  );
}
