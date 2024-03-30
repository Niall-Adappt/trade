import Axios from 'axios';
import { POLYGON_API_KEY } from './secret';

export interface TickerData {
  ticker: string,
  tickerInfo: string,
  prevOpen?: number,
  prevClose?: number
}

export interface StockTickerSearchList {
  ticker: string,
};

const getTickerSearchListPromise = async (value: string): Promise<StockTickerSearchList[]> => {
  if (!value) throw new Error("No value provided");

  const url = `https://api.polygon.io/v3/reference/tickers?market=stocks&search=${value}&active=true&sort=ticker&order=asc&limit=10&apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await Axios.get(url);
    const { results } = response.data;

    if (!results?.length) throw new Error("No results found");

    return results;
  } catch (error) {
    throw new Error("Failed to fetch stock tickers");
  }
};

const getTickerDataPromise = async (symbols: string[]): Promise<(TickerData | null)[]> => {
  const promises = symbols.map(async (symbol) => {
    if (!symbol) return null;

    try {
      const companyUrl = `https://api.polygon.io/v1/meta/symbols/${symbol}/company?&apiKey=${POLYGON_API_KEY}`;
      const prevDayUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?unadjusted=true&apiKey=${POLYGON_API_KEY}`;

      // Execute both requests concurrently for each ticker
      const [companyResponse, prevDayResponse] = await Promise.all([
        Axios.get(companyUrl),
        Axios.get(prevDayUrl)
      ]);

      const companyInfo = companyResponse.data;
      const prevDayData = prevDayResponse.data.results[0];

      if (!prevDayData) return null;

      return {
        ticker: symbol,
        tickerInfo: companyInfo,
        prevOpen: prevDayData.o,
        prevClose: prevDayData.c
      };
    } catch (error) {
      console.error(`Error fetching details for ${symbol}:`, error);
      return null; // Return null for this ticker if there's an error
    }
  });

  // Wait for all promises to resolve
  return Promise.all(promises);
};

const api = { getTickerDataPromise, getTickerSearchListPromise }; 

export default api;
