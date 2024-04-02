import React, { useState, useEffect } from 'react';
import api, { TickerData } from '@/api';
import TickerCard from './TickerCard';
// import { ChangeSinceLastDayProps } from '@/pages/homePage';
// import TickerDetails from './TickerDetails';


  // const watchList = ["TSLA", "AAPL", "GOOGL", "AMZN", "MSFT"];
  
export const WatchList: React.FC = () => {
  // const [watchList, setWacthlist] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  //replace with fetch watchlist and use the isloading and error there
  const watchList = ["TSLA"];
  
  // const fetchWatchlist = async () => {
  //   setIsLoading(true);
  //   try {
  //     const data = await api.getWatchlist();
  //     setWacthlist(data as string[]);
  //   } catch (err) {
  //     console.error(err);
  //     setError(true);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchWatchlist();
  // }); 

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>Error fetching ticker details.</div>;

  return (
    <div>
      {watchList.map((ticker, index) => (
        ticker ? 
        <div key={index}>
          <TickerCard ticker={ticker} />
        </div> 
        : <p key={index}>Failed to fetch details for {ticker} ticker.</p>
      ))}
    </div>
  );
}
