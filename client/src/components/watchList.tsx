import React, { useState, useEffect } from 'react';
import api, { TickerData, WatchlistResponse } from '@/api';
import TickerCard from './TickerCard';

export const WatchList: React.FC = () => {
  const [watchList, setWatchlist] = useState<string[]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const fetchWatchlist = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWatchlist();
      setWatchlist(data.watchlist);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  },[]); 

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching ticker details.</div>;

  return (
    <>
    <h2 className='font-bold text-xl pt-10 pb-4'>Watchlist</h2>
    <div className='w-80 flex space-x-10'>
      {watchList?.map((ticker, index) => (
        ticker ? 
        <div key={index} className='mt-auto'>
          <TickerCard ticker={ticker} />
        </div> 
        : <p key={index}>Failed to fetch details for {ticker} ticker.</p>
      ))}
    </div>
    </>

  );
}
