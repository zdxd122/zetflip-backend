import { m } from "framer-motion";
import PropTypes from "prop-types";
import { useState } from "react";
import { cross } from "../../assets/imageExport";
import { toast } from "react-hot-toast";
import "./Notifications.css";

export default function Notifications({ closeModal }) {
  const [notifications, setNotifications] = useState([]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "deposit":
        return "💰";
      case "win":
        return "🎉";
      case "system":
        return "🔔";
      case "promotion":
        return "🎁";
      default:
        return "📢";
    }
  };

  const markAsRead = (id) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    toast.success("Notification marked as read", {
      position: "top-center",
      duration: 2000,
    });
  };

  const clearAllNotifications = () => {
    const notificationCount = notifications.length;
    setNotifications([]);
    toast.success(`Cleared ${notificationCount} notification${notificationCount !== 1 ? 's' : ''}`, {
      position: "top-center",
    });
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ModalBackground"
      onClick={closeModal}
    >
      <m.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="NotificationsModal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="NotificationsHeader">
          <h2>Notifications</h2>
          <div className="HeaderActions">
            {notifications.some(n => !n.read) && (
              <button className="ClearAllButton" onClick={clearAllNotifications}>
                Clear All
              </button>
            )}
            <button className="CloseButton" onClick={closeModal}>
              <img src={cross} alt="Close" />
            </button>
          </div>
        </div>

        <div className="NotificationsContent">
          {notifications.length === 0 ? (
            <div className="NoNotifications">
              <div className="NoNotificationsIcon">🔔</div>
              <h3>No notifications yet</h3>
              <p>We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="NotificationsList">
              {notifications.map((notification) => (
                <m.div
                  key={notification.id}
                  className={`NotificationItem ${!notification.read ? 'unread' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: notification.id * 0.1 }}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="NotificationIcon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="NotificationContent">
                    <div className="NotificationHeader">
                      <h4>{notification.title}</h4>
                      <span className="NotificationTime">{notification.time}</span>
                    </div>
                    <p className="NotificationMessage">{notification.message}</p>
                  </div>
                  {!notification.read && <div className="UnreadIndicator"></div>}
                </m.div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="NotificationsFooter">
            <p className="UnreadCount">
              {notifications.filter(n => !n.read).length} unread notification{notifications.filter(n => !n.read).length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </m.div>
    </m.div>
  );
}

Notifications.propTypes = {
  closeModal: PropTypes.func.isRequired,
};