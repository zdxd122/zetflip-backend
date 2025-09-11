import { useState } from "react";
import { toast } from "react-hot-toast";
import PropTypes from "prop-types";
import {
  briefcase,
  AMPDeposit,
} from "../../assets/imageExport";
import "./Deposit.css";
import AMPDepositModal from "./AMPDeposit";
import { m } from "framer-motion";

export default function Deposit({ closeModal, changeModal }) {
  const [isLoading, setIsLoading] = useState(false);
  return (
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
        className="DepositModal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="CloseButton" onClick={closeModal}>×</button>
        <div className="Header">
          <div className="HeaderContent">
            <img src={briefcase} alt="Header Image" />
            <p>Deposit</p>
          </div>
        </div>
        <div className="Methods">
          <m.img
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.95 }}
            src={AMPDeposit}
            alt=""
            onClick={() =>
              changeModal(
                <AMPDepositModal
                  closeModal={closeModal}
                  changeModal={() =>
                    changeModal(
                      <Deposit
                        closeModal={closeModal}
                        changeModal={changeModal}
                      />
                    )
                  }
                />
              )
            }
          />
        </div>
      </m.div>
    </m.div>
  );
}

Deposit.propTypes = {
  closeModal: PropTypes.func,
  changeModal: PropTypes.func,
};
