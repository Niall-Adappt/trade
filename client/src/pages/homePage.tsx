import React, { useState, useEffect } from 'react';
import SearchInput from '@/components/SearchInput';
import TickerList from '@/components/TickerList';
import api, { StockTickerSearchList, TickerData } from '@/api';
import { Loader } from '@/components/ui/loader';
import { WatchList } from '@/components/watchList';
import TickerCard from '@/components/TickerCard';

const HomePage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [tickersSearchList, setTickersSearchList] = useState<StockTickerSearchList[]>([]);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tickerData, setTickerData] = useState<null | TickerData>(null);
  
  // const watchList = ["TSLA", "AAPL", "GOOGL", "AMZN", "MSFT"];
  const watchList = ["TSLA"];

  const handleTickerClick = async (symbol: string) => {
    if (!symbol) return;
    setTickersSearchList([]);
    setIsLoading(true);

    try {
        const resultArray = await api.getTickerDataPromise([symbol]);
        const tickerInfo = resultArray[0] || null;
        setTickerData(tickerInfo)
    } catch (error) {
        setError(true)
        console.error(error); 
    } finally {
        setIsLoading(false)
    }
    
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(false);
    setSearchValue(event.target.value.toUpperCase());
    if (!searchValue){
      setTickersSearchList([]);
      setIsLoading(false)
    }
    setIsLoading(true);
    setTickerData(null);
  };

    useEffect(()=> {
        if(searchValue){
            try {
                setIsLoading(true)
                api.getTickerSearchListPromise(searchValue)
                .then(results => {
                setTickersSearchList(results);
                })
            } catch (error) {
                console.error(error); 
            } finally {
                setIsLoading(false)
            }
        }
    },[searchValue])  

    return (
      <div>
        <h1>Home Page</h1>
        <SearchInput
        handleSearchChange={handleSearchChange}
        searchValue={searchValue}
      />
      {error && (
        <div className='error'>
          Sorry, the data for <b>{searchValue}</b> is not available.
        </div>
      )}
      {isLoading && <Loader />}
      <TickerList
        handleTickerClick={handleTickerClick}
        allTickers={tickersSearchList}
      />
      {tickerData !== null && <TickerCard tickerData={tickerData} />}
      <div className='watchList flex'>
        <WatchList watchList={watchList}/>
      </div>
      </div>
    );
  }
  
  export default HomePage;