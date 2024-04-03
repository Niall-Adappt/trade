import React, { useEffect, useState } from 'react';
import { getPercentageChange } from '@/lib/utils';
import './style.css';
import api, { TickerData } from '@/api';
import { Link } from 'react-router-dom';

interface TickerCardProps {
  ticker: string
  setIsLoading?: (value: boolean | ((prevValue: boolean) => boolean)) => void
  setError?: (value: boolean | ((prevValue: boolean) => boolean)) => void
}

const TickerCard: React.FC<TickerCardProps> = ({
ticker, setIsLoading, setError
}) => {
  const [tickerData, setTickerData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [wssPrice, setWssPrice] = useState<number | null>(null);

  //fetch data
  useEffect(() => {
    const fetchData = async () => { 
      try {
        setIsLoading?.(true);
        const tickerInformation = await api.getTickerData(ticker);
        setTickerData(tickerInformation);
      } catch (error) {
        setError?.(true);
        console.error(error);
      } finally {
        setIsLoading?.(false);
      }
    };
    fetchData();

    // Define WebSocket connection
    const backendWsUrl = import.meta.env.VITE_BACKEND_WS_URL;
    const ws = new WebSocket(backendWsUrl);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      ws.send(JSON.stringify({ action: 'subscribe', ticker: ticker })); // Subscribe to ticker updates
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Assuming the message format is { ticker: string, price: number }
      if (message.s.toUpperCase() === ticker.toLocaleUpperCase() && ['b', 'd', 'u'].includes(message.T) ) {
        setWssPrice(message.price); // Update price from WebSocket
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close(); // Clean up WebSocket connection
      console.log('WebSocket Disconnected');
    };
  }, [ticker]);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
    if (!isMounted || !tickerData) {
      return null;
    }

  // if (!name && !logo && !sector) return null;
  const  { price, changePercent, prevOpen, prevClose } = tickerData
  const displayPrice  = wssPrice || price

  const getPriceColor = () => {
    if (!prevOpen || !prevClose) return;
    const color = isNegative ? 'red' : '#37AD94';
    return { color };
  };

  const logo = `https://s3.polygon.io/logos/${ticker.toLowerCase()}/logo.png`
  const isNegative = Number(changePercent) < 0 ? true : false
  const sign = isNegative ? '-' : '+';
  const absolutDiff = (prevClose - price).toFixed(2)

  return (
    <div className='ticker-details-box'>
      <Link to={`/trade/${ticker}`}>
      <img
        className='ticker-logo mx-auto'
        src={logo}
        alt={`stock logo(${ticker})`}
        width="100"
      />
      <div className='ticker-name'>{ticker}</div>
      {/* <div className='ticker-sector'>{sector}</div> */}
      {prevOpen && prevClose && (
        <div className='price-and-color'>
          <div className='ticker-price'>
            {displayPrice} USD
          </div>
          <div
            className={`ticker-color ticker-${isNegative ? 'down' : 'up'}`}
            style={getPriceColor()}
          >
            {
              `${sign}${absolutDiff} (${changePercent}%)`
            }
          </div>
        </div>
      )}
      </Link>
    </div>
  );
};

export default TickerCard;
