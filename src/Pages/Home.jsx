import { useState, useEffect, useMemo } from "react";
import "./Home.css";
import { use } from "react";

const wcUrl = "wss://stream.binance.com:9443/ws/!miniTicker@arr";

export default function Home() {
  const [allPrices, setAllPrices] = useState({});
  const [status, setStatus] = useState("loading");
  const [sortKey, setSortKey] = useState("currentPrice");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSort = (key, order) => {
    setSortKey(key);
    setSortOrder(order);
  };

  const finalMenu = useMemo(() => {
    const cryptoMenu = Object.entries(allPrices).map(([symbol, data]) => ({
      symbol: symbol,
      ...data,
    }));
    const sortedMenu = [...cryptoMenu].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      let ans = 0;
      if (aValue < bValue) {
        ans = -1;
      } else if (aValue > bValue) {
        ans = 1;
      }
      return sortOrder === "asc" ? ans : ans * -1;
    });
    return sortedMenu;
  }, [allPrices, sortKey, sortOrder]);

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
              priceChange: oldPrice ? price - oldPrice : 0,
              priceChangePercent: oldPrice
                ? ((price - oldPrice) / oldPrice) * 100
                : 0,
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
