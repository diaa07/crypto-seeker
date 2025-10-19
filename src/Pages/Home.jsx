import { useState, useEffect } from "react";
import "./Home.css";

const wcUrl = "wss://stream.binance.com:9443/ws/!miniTicker@arr";

export default function Home() {
  const [allPrices, setAllPrices] = useState({});
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    const ws = new WebSocket(wcUrl);
    ws.onopen = () => {
      setStatus("connected");
    };
    ws.onerror = () => {
      setStatus("server error, try to reload the page");
    };
    ws.onclose = () => {
      setStatus("disconnected, trying to reconnect...");
    };

    ws.onmessage = (event) => {
      try {
        //console.log(event.data);
        const tickers = JSON.parse(event.data);
        setAllPrices((prev) => {
          const newPrices = { ...prev };
          tickers.forEach((ticker) => {
            const symbol = ticker.s;
            const price = parseFloat(ticker.c);
            const oldData = prev[symbol];
            const oldPrice = oldData ? oldData.currentPrice : 0;
            newPrices[symbol] = {
              currentPrice: price,
              priceChange: price - oldPrice,
            };
          });
          return newPrices;
        });
      } catch (e) {
        setStatus("error parsing data " + e);
      }
      //console.log(allPrices);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    console.log(allPrices);
  }, [allPrices]);
}
