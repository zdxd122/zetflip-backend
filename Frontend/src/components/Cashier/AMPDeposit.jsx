import PropTypes from "prop-types";
import "./AMPDeposit.css";
import { logoGradient, backArrow } from "../../assets/imageExport";
import { useState, useEffect } from "react";
import { m } from "framer-motion";
import config from "../../config";

export default function AMPDepositModal({ closeModal, changeModal }) {
  const [bots, setBots] = useState([]);

  useEffect(() => {
    console.log("Fetching AMP bots...");
    fetch(`${config.api}/cashier/bots/amp`, {
      method: "GET",
    }).then(async (req) => {
      console.log("AMP bots response status:", req.status);
      if (req.status == 200) {
        const foundBots = await req.json();
        console.log("Found AMP bots:", foundBots);
        setBots(foundBots);
      } else {
        console.error("Error retrieving AMP bots:", req.status);
        setBots([]);
      }
    }).catch((error) => {
      console.error("Failed to fetch AMP bots:", error);
      setBots([]);
    });
  }, []);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ModalBackground"
      onClick={closeModal}
    >
      <m.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="AMPModal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="Nav">
          <div className="Title">
            <img src={logoGradient} alt="bloxpvp logo" />
            <p>Bots</p>
          </div>
          <button className="CloseButton" onClick={closeModal}>×</button>
        </div>
        <div className="Content">
           <div className="BotsContainer">
             <div className="Bots">
               {bots.length > 0 ? (
                 bots.map((bot) => {
                   return (
                     <div key={bot._id} className="Bot">
                       <div className="Info">
                         <img src={bot.thumbnail} alt="" className="Pfp" />
                         <p className="Name">{bot.username}</p>
                         <div
                           className={
                             bot.status == "Online" ? "Online" : "Offline"
                           }
                         >
                           <div
                             className={
                               bot.status == "Online" ? "Online" : "Offline"
                             }
                           ></div>
                         </div>
                       </div>
                       <m.a
                         whileHover={{ opacity: 0.7 }}
                         whileTap={{ scale: 0.95 }}
                         href={bot.privateServer}
                         target="_blank"
                         className="Join"
                       >
                         <p>Join</p>
                       </m.a>
                     </div>
                   );
                 })
               ) : (
                 <div className="NoBots">
                   <div className="NoBotsIcon">
                     🤖
                   </div>
                   <h3>No Bots Available</h3>
                   <p>Our trading bots are currently offline.</p>
                   <p>Please check back later!</p>
                   <div className="NoBotsDecoration">
                     <div className="DecorationLine"></div>
                     <div className="DecorationDot"></div>
                     <div className="DecorationLine"></div>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
      </m.div>
    </m.div>
  );
}

AMPDepositModal.propTypes = {
  closeModal: PropTypes.func,
  changeModal: PropTypes.func,
};