import React from 'react';
import { getPercentageChange } from '@/lib/utils';
import './style.css';
import { TickerData } from '@/api';

interface TickerCardProps {
  // tickerDetails: TickerDetailsProps | null;
  // changeSinceLastDay: ChangeSinceLastDayProps | null;
tickerData: TickerData
}

const TickerCard: React.FC<TickerCardProps> = ({
tickerData
}) => {
  // if (!name && !logo && !sector) return null;
  if(!tickerData) return null
  const  {ticker, tickerInfo, prevOpen, prevClose } = tickerData
  const {name, logo, sector } = tickerInfo as any

  const getPriceColor = () => {
    if (!prevOpen || !prevClose) return;

    const color = isNegative ? 'red' : '#37AD94';

    return { color };
  };

  const isNegative = prevOpen && prevClose
    ? getPercentageChange(prevOpen, prevClose).isNegative
    : null;

  return (
    <div className='ticker-details-box'>
      <img
        className='ticker-logo mx-auto'
        src={logo}
        alt={`${name} (${ticker})`}
        width="100"
      />
      <div className='ticker-name'>{name}</div>
      <div className='ticker-sector'>{sector}</div>
      {prevOpen && prevClose && (
        <div className='price-and-color'>
          <div className='ticker-price'>{prevClose} USD</div>
          <div
            className={`ticker-color ticker-${isNegative ? 'down' : 'up'}`}
            style={getPriceColor()}
          >
            {
              getPercentageChange(prevOpen, prevClose)
                .percentage
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default TickerCard;
