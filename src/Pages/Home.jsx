import { useState, useEffect, useMemo } from "react";
import "./Home.css";
import { use } from "react";

const wcUrl = "wss://stream.binance.com:9443/ws/!miniTicker@arr";

export default function Home() {
  const [allPrices, setAllPrices] = useState({});
  const [status, setStatus] = useState("loading");
  const [sortKey, setSortKey] = useState("currentPrice");
  const [sortOrder, setSortOrder] = useState("desc");
  const maxCurrsPerPage = 15;
  const [maxPagesCount, setMaxPagesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const handleSort = (key, order) => {
    setSortKey(key);
    setSortOrder(order);
  };

  const nextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setCurrentPage((prev) => prev - 1);
  };

  const finalMenu = useMemo(() => {
    const cryptoMenu = Object.entries(allPrices).map(([symbol, data]) => ({
      symbol: symbol,
      ...data,
    }));
    const sortedMenu = [...cryptoMenu].sort((a, b) => {
      const aValue = Math.abs(a[sortKey]);
      const bValue = Math.abs(b[sortKey]);

      let ans = 0;
      if (aValue < bValue) {
        ans = -1;
      } else if (aValue > bValue) {
        ans = 1;
      }
      return sortOrder === "asc" ? ans : ans * -1;
    });
    setMaxPagesCount(Math.ceil(sortedMenu.length / maxCurrsPerPage));
    const startIndex = currentPage * maxCurrsPerPage;
    const endIndex = Math.min(startIndex + maxCurrsPerPage, sortedMenu.length);
    return sortedMenu.slice(startIndex, endIndex);
  }, [allPrices, sortKey, sortOrder, currentPage]);

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

  return (
    <div className="home">
      <div className="crypto-grid">
        <div className="crypto-grid-upper-sec">
          <select
            value={sortKey}
            id="sortKey"
            onChange={(e) => {
              handleSort(e.target.value, sortOrder);
            }}
          >
            <option value="currentPrice">Current Price</option>
            <option value="priceChange">Price Change</option>
            <option value="priceChangePercent">Price Change Percent</option>
          </select>
          <select
            value={sortOrder}
            id="sortOrder"
            onChange={(e) => {
              handleSort(sortKey, e.target.value);
            }}
          >
            <option value="asc">Ascending Order</option>
            <option value="desc">Descending Order</option>
          </select>
        </div>
        <div className="crypto-grid-lower-sec">
          <ul>
            {finalMenu.map((crypto) => {
              return (
                <li key={crypto.symbol}>
                  {crypto.symbol} {crypto.currentPrice} {crypto.priceChange}(
                  {crypto.priceChangePercent})
                </li>
              );
            })}
          </ul>
        </div>
        <div className="pagination-sec">
          showing page {currentPage + 1} out of {maxPagesCount + 1}
          {currentPage < maxPagesCount && (
            <button onClick={() => nextPage()}>next</button>
          )}
          {currentPage > 0 && <button onClick={() => prevPage()}>prev</button>}
        </div>
      </div>
    </div>
  );
}
