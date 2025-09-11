import { useState, useEffect } from "react";
import ConnectRoblox from "./ConnectRoblox";

export default function Login() {
  const [showModal, setShowModal] = useState(true);

  const closeModal = () => {
    setShowModal(false);
  };

  // Auto-open the login modal when component mounts
  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <div>
      {showModal && <ConnectRoblox closeModal={closeModal} />}
    </div>
  );
}