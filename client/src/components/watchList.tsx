import React, { useState, useEffect } from 'react';
import api, { TickerData } from '@/api';
import TickerCard from './TickerCard';
// import { ChangeSinceLastDayProps } from '@/pages/homePage';
// import TickerDetails from './TickerDetails';

interface WatchListProps{
    watchList: string[]
}
export const WatchList: React.FC<WatchListProps> = ({watchList}) => {
  const [tickerDataList, setTickerDataList] = useState<(TickerData | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const fetchTickerData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTickerDataPromise(watchList);
      setTickerDataList(data as TickerData[]);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickerData();
  }, [watchList]); // Empty dependency array means this effect runs once on mount

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching ticker details.</div>;

  return (
    <div>
      {tickerDataList.map((data, index) => (
        data ? <div key={index}>
        <TickerCard tickerData={data} />
        </div> : <p key={index}>Failed to fetch details for a ticker.</p>
      ))}
    </div>
  );
}
