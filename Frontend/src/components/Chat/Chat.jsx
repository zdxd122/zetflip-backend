import { rules, sendIcon } from "../../assets/imageExport";
import EmojiPicker from "./EmojiPicker";
import Chatbox from "./Chatbox";
import { useCallback, useEffect, useState, useRef } from "react";
import "./Chat.css";
import { useContext } from "react";
import { getJWT } from "../../utils/api";
import UserContext from "../../utils/UserContext";
import SocketContext from "../../utils/SocketContext";
import { toast } from "react-hot-toast";
import ChatRules from "../Popups/ChatRules";
import Giveaway from "./Giveaway";
import { m, AnimatePresence } from "framer-motion";
import config from "../../config";

export default function Chat() {
  const userData = useContext(UserContext);
  const socket = useContext(SocketContext);

  // Simple state management - no complex persistence
  const [modalState, setModalState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [giveawayPopup, setGiveawayPopup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Simple chat data loading
  useEffect(() => {
    console.log("Chat: Loading data");
    setIsLoading(true);

    fetch(`${config.api}/chat`, {
      mode: "cors",
      method: "GET",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        console.log("Chat data received:", data);
        setMessages(data.messages || []);
        setOnlineCount(data.onlineCount || 0);
        if (data.giveaways && data.giveaways.newGiveaways && data.giveaways.newGiveaways.length > 0) {
          setGiveawayPopup(<Giveaway Information={data.giveaways} />);
        }
      })
      .catch((error) => {
        console.error("Failed to load chat data:", error);
        setMessages([]);
        setOnlineCount(0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // Simple dependency

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleChatUpdate = useCallback(async (data) => {
    if (data && data.messages) {
      // Messages are now returned from backend in correct order (oldest first)
      setMessages(data.messages);
    }
    if (data && typeof data.onlineCount === 'number') {
      setOnlineCount(data.onlineCount);
    }
  }, []);

  const handleGiveawayPopup = useCallback(async (data) => {
    if (data && data.newGiveaways && data.newGiveaways.length >= 1) {
      setGiveawayPopup(<Giveaway Information={data} />);
    }
  }, []);

  const handleChatRulesModal = useCallback(() => {
    setModalState(<ChatRules closeModal={() => setModalState(null)} />);
  }, []);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      if (!inputValue.trim()) {
        return; // Don't send empty messages
      }

      const messageBody = JSON.stringify({
        message: inputValue.trim(),
      });

      const jwtToken = getJWT();
      if (!jwtToken) {
        toast.error("You must be logged in to send messages", {
          position: "top-right",
        });
        return;
      }

      try {
        const res = await fetch(`${config.api}/message`, {
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          mode: "cors",
          method: "POST",
          body: messageBody,
        });

        if (res.status === 429) {
          toast.error("Please wait 3 seconds in between messages", {
            position: "top-right",
          });
        } else if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        } else {
          // Success - clear input, start cooldown, and refresh messages as fallback
          setInputValue("");
          setIsCooldown(true);
          setCooldownTime(3);

          // Fallback: refresh chat data to ensure message appears
          try {
            const chatResponse = await fetch(`${config.api}/chat`, {
              mode: "cors",
              method: "GET",
            });
            if (chatResponse.ok) {
              const chatData = await chatResponse.json();
              // Messages are now returned from backend in correct order (oldest first)
              setMessages(chatData.messages || []);
              setOnlineCount(chatData.onlineCount || 0);
            }
          } catch (refreshError) {
            console.error("Failed to refresh chat after sending message:", refreshError);
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.", {
          position: "top-right",
        });
      }
    },
    [inputValue]
  );

  const handleOnlineUpdate = useCallback((count) => {
    setOnlineCount(count);
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = inputValue.substring(0, start) + emoji + inputValue.substring(end);
      setInputValue(newValue);

      // Focus back to input and set cursor position after emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  }, [inputValue]);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(!showEmojiPicker);
  }, [showEmojiPicker]);

  const handleKeyDown = useCallback((e) => {
    // Prevent emoji button from intercepting Enter key
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      if (!isCooldown && inputValue.trim()) {
        handleSendMessage(e);
      }
    }
  }, [isCooldown, inputValue, handleSendMessage]);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current && userData && !isCooldown) {
      inputRef.current.focus();
    }
  }, [userData, isCooldown]);

  // Simple socket connection
  useEffect(() => {
    if (!socket) {
      console.log("Chat: Socket not available yet");
      return;
    }

    const handleConnect = () => {
      console.log("Chat: Socket connected");
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      console.log("Chat: Socket disconnected");
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleChatUpdateEvent = (data) => {
      console.log("Chat: Received CHAT_UPDATE event");
      if (data && data.messages) {
        setMessages(data.messages);
      }
    };

    const handleOnlineUpdateEvent = (count) => {
      console.log("Chat: Received ONLINE_UPDATE event:", count);
      if (typeof count === 'number' && count >= 0) {
        setOnlineCount(count);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("CHAT_UPDATE", handleChatUpdateEvent);
    socket.on("ONLINE_UPDATE", handleOnlineUpdateEvent);

    // Set initial connection status
    setIsConnected(socket.connected);
    setConnectionStatus(socket.connected ? 'connected' : 'connecting');

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("CHAT_UPDATE", handleChatUpdateEvent);
      socket.off("ONLINE_UPDATE", handleOnlineUpdateEvent);
    };
  }, [socket]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cooldown timer effect
  useEffect(() => {
    let interval;
    if (isCooldown && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prevTime) => {
          if (prevTime <= 1) {
            setIsCooldown(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCooldown, cooldownTime]);

  // Simple cooldown timer
  useEffect(() => {
    let interval;
    if (isCooldown && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prevTime) => {
          if (prevTime <= 1) {
            setIsCooldown(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCooldown, cooldownTime]);

  return (
    <>
      <div className="Chat">

        <div className="Messages">
          {isLoading ? (
            <div className="loading-messages">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <h3>No messages yet</h3>
              <p>Be the first to chat!</p>
            </div>
          ) : (
            messages.map((message) => (
              <Chatbox
                key={message._id}
                Information={message}
                setModal={setModalState}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="SendMessage">
          <form
            action=""
            method="post"
            autoComplete="off"
            onSubmit={(e) => {
              if (!isCooldown) {
                handleSendMessage(e);
              } else {
                e.preventDefault();
              }
            }}
          >
            <div>
              {userData && getJWT() ? (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={isCooldown ? `Wait ${cooldownTime}s...` : "Say something..."}
                    value={inputValue}
                    onChange={(e) => handleInputChange(e)}
                    onKeyDown={handleKeyDown}
                    minLength="3"
                    maxLength="100"
                    disabled={isCooldown}
                    style={{
                      opacity: isCooldown ? 0.5 : 1,
                      cursor: isCooldown ? 'not-allowed' : 'text'
                    }}
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  <m.button
                    type="button"
                    whileTap={isCooldown ? {} : { scale: 0.9 }}
                    onClick={isCooldown ? undefined : toggleEmojiPicker}
                    className="EmojiButton"
                    disabled={isCooldown}
                    style={{
                      opacity: isCooldown ? 0.5 : 1,
                      cursor: isCooldown ? 'not-allowed' : 'pointer',
                      pointerEvents: isCooldown ? 'none' : 'auto'
                    }}
                  >
                    😀
                  </m.button>
                  <m.img
                    whileTap={isCooldown ? {} : { scale: 0.9 }}
                    src={sendIcon}
                    alt=""
                    onClick={isCooldown ? undefined : (e) => handleSendMessage(e)}
                    style={{
                      opacity: isCooldown ? 0.5 : 1,
                      cursor: isCooldown ? 'not-allowed' : 'pointer',
                      pointerEvents: isCooldown ? 'none' : 'auto'
                    }}
                  />
                </>
              ) : (
                <p className="error">Please login to send messages</p>
              )}
            </div>
          </form>
        </div>
        <div className="ChatInfo">
          <div className="Chatdetails">
            <div className="ChatStats">
              <div className={`ConnectionStatus ${userData ? 'connected' : 'neutral'}`}></div>
              <p className="NumberCount">{onlineCount}</p>
            </div>
          </div>
          <div className="Rules" onClick={() => handleChatRulesModal()}>
            <img src={rules} alt="Chat Rules" />
          </div>
          {giveawayPopup}
        </div>

        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
        />
      </div>
      <AnimatePresence>{modalState && modalState}</AnimatePresence>
    </>
  );
}
