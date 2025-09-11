import "./Coinflip.css";
import { heads, tails, arrow } from "../../../assets/imageExport";
import { useCallback, useState, useContext, useEffect } from "react";
import numeral from "numeral";
import CoinflipCreation from "../CoinflipCreation/CoinflipCreation";
import UserContext from "../../../utils/UserContext";
import CoinflipOverview from "../CoinflipOverview/CoinflipOverview";
import SocketContext from "../../../utils/SocketContext";
import { m, AnimatePresence } from "framer-motion";
import config from "../../../config";
import { toast } from "react-hot-toast";

export default function Coinflip() {
  const [modalState, setModalState] = useState(null);
  const userData = useContext(UserContext);
  const socket = useContext(SocketContext);
  const [activeFlips, setActiveFlips] = useState([]);
  const [previousFlips, setPreviousFlips] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [filteredGames, setFilteredGames] = useState([]);
  const [filteredGame, setFilteredGame] = useState("AMP");
  const [gameSelectionActive, setGameSelectionActive] = useState(false);
  const displayGame = filteredGame === "AMP" ? "Adopt Me" : filteredGame;

  useEffect(() => {
    fetch(`${config.api}/coinflips`, {
      mode: "cors",
      method: "GET",
    }).then(async (res) => {
      const data = await res.json();
      setActiveFlips(data.activeFlips);
      const newActiveFlips = data.activeFlips.filter((activeFlip) => {
        return activeFlip.game == filteredGame;
      });
      setFilteredGames(newActiveFlips);
      setPreviousFlips(data.previousFlips);
      if (!data.currentStats.totalValue[0]?.value) {
        const newStats = {
          totalValue: [
            {
              value: 0,
            },
          ],
          headsValue: data.currentStats.headsValue || [{ value: 0 }],
          tailsValue: data.currentStats.tailsValue || [{ value: 0 }],
          currentActive: data.currentStats.currentActive,
          totalGames: data.currentStats.totalGames,
        };
        setStatistics(newStats);
      } else {
        setStatistics({
          ...data.currentStats,
          headsValue: data.currentStats.headsValue || [{ value: 0 }],
          tailsValue: data.currentStats.tailsValue || [{ value: 0 }],
        });
      }
    });
  }, [filteredGame]);

  const handleFilterGameUpdate = useCallback(
    (game) => {
      const backendGame = game === "Adopt Me" ? "AMP" : game;
      setFilteredGame(backendGame);
      const newActiveFlips = activeFlips.filter((activeFlip) => {
        return activeFlip.game == backendGame;
      });
      setFilteredGames(newActiveFlips);
      setGameSelectionActive(false);
    },
    [activeFlips]
  );

  const handleCoinflipsUpdate = useCallback(
    (data) => {
      setActiveFlips(data.activeFlips);
      const newActiveFlips = data.activeFlips.filter((activeFlip) => {
        return activeFlip.game == filteredGame;
      });
      setFilteredGames(newActiveFlips);
      setPreviousFlips(data.previousFlips);
      const headsCount = data.activeFlips.filter(flip => flip.ownerCoin === 'heads').length;
      const tailsCount = data.activeFlips.filter(flip => flip.ownerCoin === 'tails').length;

      if (!data.currentStats.totalValue[0]?.value) {
        const newStats = {
          totalValue: [
            {
              value: 0,
            },
          ],
          headsValue: data.currentStats.headsValue || [{ value: 0 }],
          tailsValue: data.currentStats.tailsValue || [{ value: 0 }],
          headsCount,
          tailsCount,
          currentActive: data.currentStats.currentActive,
          totalGames: data.currentStats.totalGames,
        };
        setStatistics(newStats);
      } else {
        setStatistics({
          ...data.currentStats,
          headsValue: data.currentStats.headsValue || [{ value: 0 }],
          tailsValue: data.currentStats.tailsValue || [{ value: 0 }],
          headsCount,
          tailsCount,
        });
      }
    },
    [filteredGame]
  );

  const handleCreationModal = useCallback(() => {
    if (userData != null) {
      setModalState(
        <CoinflipCreation
          renderModal={setModalState}
          closeModal={() => setModalState(null)}
        />
      );
    }
  }, [userData]);

  useEffect(() => {
    if (socket) {
      socket.on("COINFLIP_UPDATE", handleCoinflipsUpdate);
      return () => {
        socket.off("COINFLIP_UPDATE", handleCoinflipsUpdate);
      };
    }
  }, [socket, handleCoinflipsUpdate]);

  return (
    <>
      <div className="Coinflip">
        <div className="CurrentGames">
          <div className="Interactive">
            <div className="Creation">
              <div className="GameInteractivity">
                <button onClick={handleCreationModal}>Create Game</button>
              </div>
              <div className="Options">
                <div className="PreviousResults">
                  {previousFlips &&
                    previousFlips.map((flip) => {
                      {
                        return (
                          <img
                            src={flip.winnerCoin == "heads" ? heads : tails}
                            key={flip._id}
                            alt="Previous Result"
                          />
                        );
                      }
                    })}
                </div>
                <div className="GameFilter" style={{ display: 'flex', gap: '10px', height: '40px', alignItems: 'center' }}>
                  <div className="AmountItem" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <img src={heads} alt="Heads" />
                    <span className="Amount" style={{ color: '#fff', fontSize: '14px', fontFamily: 'inherit' }}>{statistics?.headsCount || 0}</span>
                  </div>
                  <div className="AmountItem" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <img src={tails} alt="Tails" />
                    <span className="Amount" style={{ color: '#fff', fontSize: '14px', fontFamily: 'inherit' }}>{statistics?.tailsCount || 0}</span>
                  </div>
                </div>
                <div className="SortGamesContainer">
                  <select
                    name="sortGames"
                    defaultValue={"HighestToLowest"}
                    className="SortGames"
                    style={{ backgroundColor: '#e0e0e0', color: '#000', border: '1px solid #ccc' }}
                  >
                    <option value="HighestToLowest">Highest To Lowest</option>
                    <option value="LowestToHighest">Lowest To Highest</option>
                  </select>
                  <img src={arrow} alt="" className="SortArrow" />
                </div>
                <m.div
                  className="GameFilter"
                >
                  <p>{displayGame}</p>
                  <AnimatePresence>
                    {gameSelectionActive && (
                      <m.div
                        initial={{ scale: 0.95, y: -5, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -5, opacity: 0 }}
                        transition={{ ease: "easeOut", duration: 0.1 }}
                        className="FilterOptions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="FilterOption"
                        >
                          <p>Adopt Me</p>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              </div>
            </div>
          </div>
          <div className="Statistics">
            <div className="Stat TotalItems">
              <p className="Amount">
                {statistics && statistics.currentActive}
              </p>
              <p className="Description">Games</p>
            </div>
            <div className="Stat TotalValue">
              <p className="Amount">
                {statistics &&
                  numeral(statistics.totalValue[0].value).format("0,0")}
                +
              </p>
              <p className="Description">Value</p>
            </div>
          </div>
          {filteredGames.map((flip) => {
            return (
              <AnimatePresence key={flip._id}>
                <CoinflipOverview
                  renderModal={setModalState}
                  Information={flip}
                ></CoinflipOverview>
              </AnimatePresence>
            );
          })}
        </div>
      </div>
      <AnimatePresence>{modalState && modalState}</AnimatePresence>
    </>
  );
}
