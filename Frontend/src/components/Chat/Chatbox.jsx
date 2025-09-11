import PropTypes from "prop-types";
import { format } from "date-fns";
import "./Chatbox.css";
import { whale, owner } from "../../assets/imageExport";
import { useCallback } from "react";
import Profile from "../Popups/Profile";
import "flag-icons/css/flag-icons.min.css";

// Country flag mapping for chat messages
const flagMapping = {
  "🇺🇸": "fi fi-us",
  "🇬🇧": "fi fi-gb",
  "🇨🇦": "fi fi-ca",
  "🇦🇺": "fi fi-au",
  "🇩🇪": "fi fi-de",
  "🇫🇷": "fi fi-fr",
  "🇮🇹": "fi fi-it",
  "🇯🇵": "fi fi-jp",
  "🇰🇷": "fi fi-kr",
  "🇨🇳": "fi fi-cn",
  "🇮🇳": "fi fi-in",
  "🇧🇷": "fi fi-br",
  "🇷🇺": "fi fi-ru",
  "🇪🇸": "fi fi-es",
  "🇳🇱": "fi fi-nl",
  "🇧🇪": "fi fi-be",
  "🇨🇭": "fi fi-ch",
  "🇦🇹": "fi fi-at",
  "🇸🇪": "fi fi-se",
  "🇳🇴": "fi fi-no",
  "🇩🇰": "fi fi-dk",
  "🇫🇮": "fi fi-fi",
  "🇵🇱": "fi fi-pl",
  "🇨🇿": "fi fi-cz",
  "🇭🇺": "fi fi-hu",
  "🇵🇹": "fi fi-pt",
  "🇬🇷": "fi fi-gr",
  "🇹🇷": "fi fi-tr",
  "🇲🇽": "fi fi-mx",
  "🇦🇷": "fi fi-ar",
  "🇨🇴": "fi fi-co",
  "🇨🇱": "fi fi-cl",
  "🇵🇪": "fi fi-pe",
  "🇻🇪": "fi fi-ve",
  "🇪🇨": "fi fi-ec",
  "🇺🇾": "fi fi-uy",
  "🇵🇾": "fi fi-py",
  "🇧🇴": "fi fi-bo",
  "🇸🇻": "fi fi-sv",
  "🇬🇹": "fi fi-gt",
  "🇭🇳": "fi fi-hn",
  "🇳🇮": "fi fi-ni",
  "🇨🇷": "fi fi-cr",
  "🇵🇦": "fi fi-pa",
  "🇩🇴": "fi fi-do",
  "🇯🇲": "fi fi-jm",
  "🇭🇹": "fi fi-ht",
  "🇨🇺": "fi fi-cu",
  "🇵🇷": "fi fi-pr",
  "🇧🇧": "fi fi-bb",
  "🇹🇹": "fi fi-tt",
  "🇬🇾": "fi fi-gy",
  "🇸🇷": "fi fi-sr",
  "🇦🇼": "fi fi-aw",
  "🇧🇶": "fi fi-bq",
  "🇨🇼": "fi fi-cw",
  "🇸🇽": "fi fi-sx",
  "🇧🇱": "fi fi-bl",
  "🇬🇫": "fi fi-gf",
  "🇬🇵": "fi fi-gp",
  "🇲🇶": "fi fi-mq",
  "🇾🇹": "fi fi-yt",
  "🇷🇪": "fi fi-re",
  "🇵🇫": "fi fi-pf",
  "🇳🇨": "fi fi-nc",
  "🇼🇫": "fi fi-wf",
  "🇵🇲": "fi fi-pm",
  "🇬🇱": "fi fi-gl",
  "🇫🇴": "fi fi-fo",
  "🇦🇽": "fi fi-ax",
  "🇮🇸": "fi fi-is",
  "🇮🇪": "fi fi-ie",
  "🇱🇺": "fi fi-lu",
  "🇲🇨": "fi fi-mc",
  "🇱🇮": "fi fi-li",
  "🇦🇩": "fi fi-ad",
  "🇸🇲": "fi fi-sm",
  "🇻🇦": "fi fi-va",
  "🇲🇹": "fi fi-mt",
  "🇨🇾": "fi fi-cy",
  "🇧🇬": "fi fi-bg",
  "🇷🇴": "fi fi-ro",
  "🇭🇷": "fi fi-hr",
  "🇸🇮": "fi fi-si",
  "🇲🇪": "fi fi-me",
  "🇷🇸": "fi fi-rs",
  "🇲🇰": "fi fi-mk",
  "🇦🇱": "fi fi-al",
  "🇽🇰": "fi fi-xk",
  "🇧🇦": "fi fi-ba",
  "🇲🇩": "fi fi-md",
  "🇪🇪": "fi fi-ee",
  "🇱🇻": "fi fi-lv",
  "🇱🇹": "fi fi-lt",
  "🇧🇾": "fi fi-by",
  "🇺🇦": "fi fi-ua",
  "🇬🇪": "fi fi-ge",
  "🇦🇲": "fi fi-am",
  "🇦🇿": "fi fi-az",
  "🇰🇿": "fi fi-kz",
  "🇰🇬": "fi fi-kg",
  "🇹🇯": "fi fi-tj",
  "🇹🇲": "fi fi-tm",
  "🇺🇿": "fi fi-uz",
  "🇲🇳": "fi fi-mn",
  "🇰🇵": "fi fi-kp",
  "🇹🇼": "fi fi-tw",
  "🇭🇰": "fi fi-hk",
  "🇲🇴": "fi fi-mo",
  "🇯🇴": "fi fi-jo",
  "🇱🇧": "fi fi-lb",
  "🇸🇾": "fi fi-sy",
  "🇮🇶": "fi fi-iq",
  "🇰🇼": "fi fi-kw",
  "🇸🇦": "fi fi-sa",
  "🇧🇭": "fi fi-bh",
  "🇶🇦": "fi fi-qa",
  "🇦🇪": "fi fi-ae",
  "🇴🇲": "fi fi-om",
  "🇾🇪": "fi fi-ye",
  "🇮🇱": "fi fi-il",
  "🇵🇸": "fi fi-ps",
  "🇪🇬": "fi fi-eg",
  "🇱🇾": "fi fi-ly",
  "🇩🇿": "fi fi-dz",
  "🇲🇦": "fi fi-ma",
  "🇹🇳": "fi fi-tn",
  "🇪🇭": "fi fi-eh",
  "🇲🇷": "fi fi-mr",
  "🇲🇱": "fi fi-ml",
  "🇸🇳": "fi fi-sn",
  "🇬🇲": "fi fi-gm",
  "🇬🇳": "fi fi-gn",
  "🇸🇱": "fi fi-sl",
  "🇱🇷": "fi fi-lr",
  "🇨🇮": "fi fi-ci",
  "🇧🇫": "fi fi-bf",
  "🇹🇬": "fi fi-tg",
  "🇧🇯": "fi fi-bj",
  "🇳🇪": "fi fi-ne",
  "🇳🇬": "fi fi-ng",
  "🇹🇩": "fi fi-td",
  "🇨🇲": "fi fi-cm",
  "🇨🇫": "fi fi-cf",
  "🇬🇦": "fi fi-ga",
  "🇨🇬": "fi fi-cg",
  "🇦🇴": "fi fi-ao",
  "🇬🇶": "fi fi-gq",
  "🇸🇹": "fi fi-st",
  "🇨🇻": "fi fi-cv",
  "🇬🇼": "fi fi-gw",
  "🇧🇮": "fi fi-bi",
  "🇷🇼": "fi fi-rw",
  "🇹🇿": "fi fi-tz",
  "🇰🇪": "fi fi-ke",
  "🇺🇬": "fi fi-ug",
  "🇸🇴": "fi fi-so",
  "🇩🇯": "fi fi-dj",
  "🇪🇹": "fi fi-et",
  "🇪🇷": "fi fi-er",
  "🇸🇸": "fi fi-ss",
  "🇸🇩": "fi fi-sd",
  "🇿🇦": "fi fi-za",
  "🇧🇼": "fi fi-bw",
  "🇿🇲": "fi fi-zm",
  "🇿🇼": "fi fi-zw",
  "🇲🇼": "fi fi-mw",
  "🇲🇿": "fi fi-mz",
  "🇸🇿": "fi fi-sz",
  "🇱🇸": "fi fi-ls",
  "🇳🇦": "fi fi-na",
  "🇲🇬": "fi fi-mg",
  "🇲🇺": "fi fi-mu",
  "🇸🇨": "fi fi-sc",
  "🇹🇴": "fi fi-to",
  "🇼🇸": "fi fi-ws",
  "🇸🇧": "fi fi-sb",
  "🇻🇺": "fi fi-vu",
  "🇳🇷": "fi fi-nr",
  "🇹🇻": "fi fi-tv",
  "🇰🇮": "fi fi-ki",
  "🇲🇭": "fi fi-mh",
  "🇵🇼": "fi fi-pw",
  "🇫🇲": "fi fi-fm",
  "🇲🇵": "fi fi-mp",
  "🇬🇺": "fi fi-gu",
  "🇦🇸": "fi fi-as",
  "🇻🇮": "fi fi-vi",
  "🇺🇲": "fi fi-um",
  "🇲🇸": "fi fi-ms",
  "🇹🇨": "fi fi-tc",
  "🇻🇬": "fi fi-vg",
  "🇧🇲": "fi fi-bm",
  "🇰🇾": "fi fi-ky",
  "🇦🇮": "fi fi-ai",
  "🇫🇰": "fi fi-fk",
  "🇬🇸": "fi fi-gs",
  "🇸🇭": "fi fi-sh",
  "🇮🇴": "fi fi-io",
  "🇵🇳": "fi fi-pn",
  "🇨🇽": "fi fi-cx",
  "🇨🇨": "fi fi-cc",
  "🇳🇫": "fi fi-nf",
  "🇦🇶": "fi fi-aq",
  "🇧🇻": "fi fi-bv",
  "🇭🇲": "fi fi-hm",
  "🇹🇫": "fi fi-tf"
};

// Function to process message text and convert flag emojis to flag icons
const processMessageText = (text) => {
  let processedText = text;

  // Replace flag emojis with flag icon spans
  Object.keys(flagMapping).forEach(flagEmoji => {
    const flagClass = flagMapping[flagEmoji];
    const flagSpan = `<span class="${flagClass}" style="font-size: 12px; display: inline-block; margin: 0 1px;"></span>`;
    processedText = processedText.replace(new RegExp(flagEmoji, 'g'), flagSpan);
  });

  return processedText;
};

export default function Chatbox({ Information, setModal }) {
  const loadProfile = useCallback(() => {
    setModal(
      <Profile
        closeModal={() => setModal(null)}
        userId={Information.robloxId}
      />
    );
  }, [Information, setModal]);
  if (Information.rank == "Owner") {
    return (
      <div className="Chatbox Owner">
        <img
          src={Information.thumbnail}
          alt="Roblox Avatar"
          onClick={loadProfile}
        />
        <div className="Content">
          <div className="Username">
            <div className="User">
              <img src={owner} alt="owner icon" />
              <h1>{Information.username}</h1>
            </div>
            <div className="Timestamp">
              <p>{format(Information.timestamp, "h:mm")}</p>
            </div>
          </div>
          <p
            className="message"
            dangerouslySetInnerHTML={{ __html: processMessageText(Information.message) }}
          ></p>
        </div>
      </div>
    );
  } else if (Information.rank == "Whale") {
    return (
      <div className="Chatbox Whale">
        <img
          src={Information.thumbnail}
          alt="Roblox Avatar"
          onClick={loadProfile}
        />
        <div className="Content">
          <div className="Username">
            <div className="User">
              <img src={whale} alt="whale icon" />
              <h1>{Information.username}</h1>
            </div>
            <div className="Timestamp">
              <p>{format(Information.timestamp, "h:mm")}</p>
            </div>
          </div>
          <p
            className="message"
            dangerouslySetInnerHTML={{ __html: processMessageText(Information.message) }}
          ></p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="Chatbox">
        <img
          src={Information.thumbnail}
          alt="Roblox Avatar"
          onClick={loadProfile}
        />
        <div className="Content">
          <div className="Username">
            <h1>{Information.username}</h1>
            <div className="Timestamp">
              <p>{format(Information.timestamp, "h:mm")}</p>
            </div>
          </div>
          <p
            className="message"
            dangerouslySetInnerHTML={{ __html: processMessageText(Information.message) }}
          ></p>
        </div>
      </div>
    );
  }
}

Chatbox.propTypes = {
  Information: PropTypes.object,
  setModal: PropTypes.func,
};
