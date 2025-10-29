import { useState, useEffect, useMemo } from "react";
import "./Home.css";

const wcUrl = "wss://stream.binance.com:9443/ws/!miniTicker@arr";

export default function Home() {
  const [allPrices, setAllPrices] = useState({});
  const [status, setStatus] = useState("loading");
  const [sortKey, setSortKey] = useState("currentPrice");
  const [sortOrder, setSortOrder] = useState("desc");
  const maxCurrsPerPage = 15;
  const [maxPagesCount, setMaxPagesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortKeyOpen, setSortKeyOpen] = useState(false);
  const [sortOrderOpen, setSortOrderOpen] = useState(false);

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
          <div className="selecter">
            <div
              className="current-selection"
              onClick={() => setSortKeyOpen(!sortKeyOpen)}
            >
              {sortKey} &#9660;{" "}
            </div>{" "}
            <div
              className={`selection-menu-${sortKeyOpen ? "open" : "closed"}`}
            >
              <div
                className="selection-option"
                onClick={() => {
                  handleSort("currentPrice", sortOrder);
                  setSortKeyOpen(false);
                }}
              >
                Current Price
              </div>
              <div
                className="selection-option"
                onClick={() => {
                  handleSort("priceChange", sortOrder);
                  setSortKeyOpen(false);
                }}
              >
                Price Change
              </div>
              <div
                className="selection-option"
                onClick={() => {
                  handleSort("priceChangePercent", sortOrder);
                  setSortKeyOpen(false);
                }}
              >
                Price Change Percent
              </div>
            </div>
          </div>

          <div className="selecter">
            <div
              className="current-selection"
              onClick={() => setSortOrderOpen(!sortOrderOpen)}
            >
              {sortOrder} &#9660;{" "}
            </div>
            <div
              className={`selection-menu-${sortOrderOpen ? "open" : "closed"}`}
            >
              <div
                className="selection-option"
                onClick={() => {
                  handleSort(sortKey, "asc");
                  setSortOrderOpen(false);
                }}
              >
                ASC
              </div>
              <div
                className="selection-option"
                onClick={() => {
                  handleSort(sortKey, "desc");
                  setSortOrderOpen(false);
                }}
              >
                Desc
              </div>
            </div>
          </div>
        </div>
        <div className="crypto-grid-lower-sec">
          <table className="crypto-menu">
            <thead>
              <tr>
                <td>Name</td>
                <td>Price</td>
                <td>Price Change</td>
              </tr>
            </thead>
            <tbody>
              {finalMenu.map((crypto) => {
                return (
                  <tr key={crypto.symbol} className="crypto-item">
                    <td className="crypto-symbol">{crypto.symbol}</td>
                    <td className="crypto-price">
                      {crypto.currentPrice.toFixed(5)}
                    </td>
                    <td
                      className={`crypto-price-change-${
                        crypto.priceChange >= 0 ? "inc" : "dec"
                      }`}
                    >
                      {crypto.priceChange.toFixed(5)} (
                      {crypto.priceChangePercent.toFixed(2)}
                      %)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
