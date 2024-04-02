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
  
  useEffect(() => {
    const fetchData = async () => { 
      try {
        setIsLoading?.(true);

        const tickerInformation = await api.getTickerData(ticker);
        // const tickerInformation = resultArray[0] || null;
        setTickerData(tickerInformation);
      } catch (error) {
        setError?.(true);
        console.error(error);
      } finally {
        setIsLoading?.(false);
      }
    };

    fetchData();
  }, [ticker]);

    useEffect(() => {
      setIsMounted(true);
    }, []);
  
    if (!isMounted || !tickerData) {
      return null;
    }
  // if (!name && !logo && !sector) return null;
  const  { price, changePercent, prevOpen, prevClose } = tickerData

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
          <div className='ticker-price'>{price} USD</div>

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
