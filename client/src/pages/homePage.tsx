import React, { useState, useEffect } from 'react';
import SearchInput from '@/components/SearchInput';
import TickerList from '@/components/TickerList';
import api, { StockTickerSearchList, TickerData } from '@/api';
import { Loader } from '@/components/ui/loader';
import TickerCard from '@/components/TickerCard';
import { WatchList } from '@/components/watchList';

const HomePage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [tickersSearchList, setTickersSearchList] = useState<StockTickerSearchList[]>([]);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tickerSelected, setTickerSelected] = useState('')

  const handleTickerClick = async (symbol: string) => {
    if (!symbol) return;
    setTickersSearchList([]);
    setTickerSelected(symbol)
    setIsLoading(true);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTickerSelected('')
    setError(false);
    setSearchValue(event.target.value.toUpperCase());
    if (!searchValue){
      setTickersSearchList([]);
      setIsLoading(false)
    }
    setIsLoading(true);
  };

    useEffect(()=> {
        if(searchValue){
            try {
                setIsLoading(true)
                api.getTickerSearchList(searchValue)
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
      {tickerSelected !== null && <TickerCard ticker={tickerSelected} setIsLoading={setIsLoading} setError={setError} />}
      <div className='watchList flex'>
        <WatchList/>
      </div>
      </div>
    );
  }
  
  export default HomePage;