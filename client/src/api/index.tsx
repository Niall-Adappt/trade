// import axios from 'axios';
import apiInstance from "./apiConfig"; 

export interface TickerData {
  ticker: string,
  tickerInfo: string,
  prevOpen?: number,
  prevClose?: number
}

export interface StockTickerSearchList {
  ticker: string,
};

const getTickerSearchList = async (value: string) => {
  if (!value) throw new Error("No value provided");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const url = `${backendUrl}/searchList/${value}`;

  try {
    const response = await apiInstance.get(url);
    const results = response.data;

    if (!results.length) throw new Error("No results found");

    return results;
  } catch (error) {
    console.error('Error fetching ticker: ', error);
    throw new Error("Failed to fetch stock tickers");
  } 
};

const getTickerData = async (symbol: string): Promise<(any)> => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const url = `${backendUrl}/stock/data/${symbol}`;

    try {
      // const response = await axios.get(url);
      const response = await apiInstance.get(url);
      return response.data
    } catch (error) {
      console.error(`Error fetching ticker data:`, error);
      return null; 
    }
};

export interface WatchlistResponse {
  watchlist: string[];
}

const getWatchlist = async (): Promise<WatchlistResponse> => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const url = `${backendUrl}/user/watchlist`;

  try {
    const response = await apiInstance.get(url)
    return response.data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw new Error("Failed to fetch watchlist");

  }
};

const api = { getTickerSearchList, getWatchlist, getTickerData }; 

export default api;
