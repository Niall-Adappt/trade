import axios from 'axios';

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
    const response = await axios.get(url);
    const results = response.data;

    if (!results.length) throw new Error("No results found");

    return results;
  } catch (error) {
    console.error('Error fetching ticker: ', error);
    throw new Error("Failed to fetch stock tickers");
  } 
};

// const getTickerDataPromise = async (symbols: string[]): Promise<(TickerData | null)[]> => {
//   const promises = symbols.map(async (symbol) => {
//     if (!symbol) return null;

//     try {
//       const companyUrl = `https://api.polygon.io/v1/meta/symbols/${symbol}/company?&apiKey=${POLYGON_API_KEY}`;
//       const prevDayUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?unadjusted=true&apiKey=${POLYGON_API_KEY}`;

//       // Execute both requests concurrently for each ticker
//       const [companyResponse, prevDayResponse] = await Promise.all([
//         Axios.get(companyUrl),
//         Axios.get(prevDayUrl)
//       ]);

//       const companyInfo = companyResponse.data;
//       const prevDayData = prevDayResponse.data.results[0];

//       if (!prevDayData) return null;

//       return {
//         ticker: symbol,
//         tickerInfo: companyInfo,
//         prevOpen: prevDayData.o,
//         prevClose: prevDayData.c
//       };
//     } catch (error) {
//       console.error(`Error fetching details for ${symbol}:`, error);
//       return null; 
//     }
//   });

//   // Wait for all promises to resolve
//   return Promise.all(promises);
// };

const getTickerData = async (symbol: string): Promise<(any)> => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const url = `${backendUrl}/stock/data/${symbol}`;
  console.log('getTickerData url: ', url)
    try {
      const response = await axios.get(url);
      return response.data
    } catch (error) {
      console.error(`Error fetching ticker data:`, error);
      return null; 
    }
};

const getWatchlist = async (): Promise<(string | null)[]> => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const url = `${backendUrl}/user/watchlist`;

  try {
    const response = await axios.get(url)
    return response.data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [null]
  }
};

const api = { getTickerSearchList, getWatchlist, getTickerData }; 

export default api;
