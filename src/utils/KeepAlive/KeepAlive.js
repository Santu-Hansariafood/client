import { useEffect } from "react";
import axios from "axios";

const SERVER_URL = "https://phpserver-v77g.onrender.com";

const keepBackendAlive = () => {
  setInterval(() => {
    axios
      .get(`${SERVER_URL}/api/keep-alive`)
      .then(() => console.log("Backend keep-alive ping successful"))
      .catch((err) => console.error("Keep-alive ping failed", err.message));
  }, 4 * 60 * 1000);
};

const KeepAlive = () => {
  useEffect(() => {
    keepBackendAlive();
  }, []);

  return null;
};

export default KeepAlive;
