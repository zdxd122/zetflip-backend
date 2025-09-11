import "./Login.css";
import PropTypes from "prop-types";
import { longLogo, copy } from "../../assets/imageExport";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { m } from "framer-motion";
import config from "../../config";
import { useLocation } from "react-router-dom";

export default function ConnectRoblox({ closeModal }) {
  const [step, setStep] = useState(1);
  const [descriptionCode, setDescriptionCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const location = useLocation();
  const { search } = location;

  const handleLoginSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      console.log('🔍 Form submitted, step:', step, 'username:', username);
      setIsLoading(true);

      try {
        const urlParams = new URLSearchParams(search);
        const requestBody = JSON.stringify({
          username,
          referrer: urlParams.get("referrer"),
        });

        const response = await fetch(`${config.api}/connect-roblox`, {
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
          mode: "cors",
          method: "POST",
          body: requestBody,
        });

        if (step === 1) {
          if (response.status === 200) {
            const descriptionCode = await response.text();
            setDescriptionCode(descriptionCode);
            setStep(2);
            toast.success("Description code generated successfully!");
          } else {
            // Handle step 1 errors
            try {
              const data = await response.json();
              if (data?.errors) {
                data.errors.forEach((err) => {
                  toast.error(err.msg);
                });
              } else if (data?.message) {
                toast.error(data.message);
              } else {
                toast.error("Failed to generate description code");
              }
            } catch {
              const errorText = await response.text();
              toast.error(errorText || "Failed to connect to Roblox");
            }
          }
        } else {
          // Step 2: Verify description
          if (response.status === 400) {
            toast.error("Description does not match - please copy the exact code");
          } else if (response.status === 200) {
            const data = await response.json();
            console.log('Login response:', data);

            if (data.token) {
              document.cookie = `jwt=${data.token}; expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
              toast.success("Login Successful!");
              // Trigger a custom event to notify the app of login
              window.dispatchEvent(new CustomEvent('userLogin'));
              // Close modal first, then reload
              closeModal();
              setTimeout(() => {
                window.location.reload();
              }, 500);
            } else {
              toast.error("Login failed - no token received");
            }
          } else {
            try {
              const errorData = await response.json();
              toast.error(errorData.message || "Login failed");
            } catch {
              toast.error("Login failed - please try again");
            }
          }
        }
      } catch (error) {
        console.error("Network error:", error);

        if (error.message.includes("Failed to fetch")) {
          toast.error("Network error - please check your connection");
        } else if (error.message.includes("CORS")) {
          toast.error("Connection blocked - please contact support");
        } else {
          toast.error("An error occurred - please try again");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [step, username, search, closeModal]
  );

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(descriptionCode);
    toast("Code copied");
  }, [descriptionCode]);

  return (
    <>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="ModalBackground"
        onClick={closeModal}
      >
        {isLoading && (
          <div className="loadingContainer">
            <div className="loading"></div>
          </div>
        )}
        <m.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="LoginModal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="Art">
            <img src={longLogo} alt="BLOXPVP Logo" className="Logo" />
            <h1>THE MOST REWARDING AND INNOVATIVE ROBLOX CASINO</h1>
            <p className="ArtFooter">
              By signing in you confirm that you are 18 years of age or over, of
              sound mind capable of taking responsibility for your own actions &
              are in proper jurisdiction, and have read and agreed to our terms
              of service.
            </p>
          </div>
          <div className="Login">
            <div className="Content">
              <div className="Heading">
                <h2>Connect Roblox Account</h2>
                <p className="Subtext">
                  Before you start using our platform please connect your Roblox
                  account with our website.
                </p>
              </div>
              <form action="" onSubmit={(e) => { console.log('🔥 Form onSubmit triggered'); handleLoginSubmit(e); }}>
                {step === 1 && (
                  <div className="form-group">
                    <label className="inputLabel" htmlFor="RobloxName">
                      Roblox Username
                    </label>
                    <input
                      className="input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      type="text"
                      name="RobloxName"
                      placeholder="Your Roblox Username"
                    />
                  </div>
                )}
                {step === 2 && (
                  <div className="form-group">
                    <p className="inputLabel">
                      Put the following code into your roblox description
                    </p>
                    <div className="text">
                      <img
                        src={copy}
                        alt="Copy Description"
                        onClick={() => handleCopyCode()}
                      />
                      <p>{descriptionCode}</p>
                    </div>
                  </div>
                )}

                {/* <HCaptcha
                  sitekey={config.h_captcha_key}
                  onVerify={(token, ekey) =>
                    this.setState({
                      ...this.state,
                      captcha: token
                    })
                  }
                /> */}

                <button type="submit" onClick={() => console.log('🔘 Connect button clicked')}>Connect</button>
              </form>
            </div>
            <div className="Footer">
              <p className="FooterText">
                By signing in you confirm that you are 18 years of age or over,
                of sound mind capable of taking responsibility for your own
                actions & are in proper jurisdiction, and have read and agreed
                to our terms of service.
              </p>
              <div className="ExtraLinks">
                <p className="Terms">Terms of Use</p>
                <p className="Support">Support</p>
              </div>
            </div>
          </div>
        </m.div>
      </m.div>
    </>
  );
}

ConnectRoblox.propTypes = {
  closeModal: PropTypes.func,
  submitForm: PropTypes.func,
};
