import { add, sub, formatISO } from 'date-fns'; // Assuming date-fns is used for date calculations
import Cache from "node-cache";
import axios from "axios";
const stockCache = new Cache({ stdTTL: 60 }); // 1 minute
const Alpaca = require("@alpacahq/alpaca-trade-api");
import dotenv from "dotenv";

dotenv.config();
const alpaca = new Alpaca() //auto retrieves data from .env to create alpaca client

export const fetchStockData = async (symbol: string): Promise<any> => {
	const cacheKey = symbol + "-quote";
	const alpaca = new Alpaca() //auto retrieves data from .env to create alpaca client

	try {
		if (stockCache.has(cacheKey)) {
			return stockCache.get(cacheKey);
		} else {
			const snapshot = await alpaca.getSnapshot(symbol)

			const regularMarketPrice = snapshot.LatestTrade.Price;
			const regularMarketPreviousClose = snapshot.PrevDailyBar.ClosePrice;
			// Calculate the percentage change from the previous close to the latest price
			const regularMarketChangePercent = ((regularMarketPrice - regularMarketPreviousClose) / regularMarketPreviousClose) * 100;
	  
			const stockData = {
				symbol,
				// longName: symbol, // fetching from another source if necessary
				regularMarketPrice,
				regularMarketPreviousClose,
				regularMarketChangePercent: regularMarketChangePercent.toFixed(2), // Formatting to 2 decimal places for consistency
			  };

			stockCache.set(cacheKey, stockData);
			return stockData;
		}
	} catch (err: any) {
		// if (err.result && Array.isArray(err.result)) {
		// 	let quote = err.result[0];

		// 	const {
		// 		regularMarketPrice,
		// 		regularMarketChangePercent,
		// 		longName,
		// 		regularMarketPreviousClose,
		// 	} = quote;

		// 	const stockData = {
		// 		symbol,
		// 		// longName,
		// 		regularMarketPrice,
		// 		regularMarketPreviousClose,
		// 		regularMarketChangePercent,
		// 	};

		// 	stockCache.set(cacheKey, stockData);
		// 	return stockData;
		// } else {
		// 	console.error(err);
		// 	console.error("Error fetching " + symbol + " stock data:", err);
		// 	throw new Error(err);
		// }
		console.error("Error [fetchStockData] " + symbol + " stock data:", err);
		throw new Error(err);
	}
};

export const fetchStocksData = async (symbols: string[]): Promise<any[]> => {
	const alpaca = new Alpaca(); // Auto retrieves data from .env to create alpaca client
	const results = [];
	const symbolsToFetch = symbols.filter(symbol => !stockCache.has(symbol + "-quote"));

	// Add cached data to results
	symbols.filter(symbol => stockCache.has(symbol + "-quote"))
	.forEach(cachedSymbol => {
		const cacheKey = cachedSymbol + "-quote";
		results.push(stockCache.get(cacheKey));
	});
  
	// If there are symbols to fetch, use alpaca.getSnapshot to fetch them in a single call
	if (symbolsToFetch.length > 0) {
	  try {
		const snapshots = await alpaca.getSnapshots(symbolsToFetch); // returns an object with symbol keys?
		// const logos = await alpaca.getLogos(symbolsToFetch)
		// console.log('utils/requests.ts fetchStocksData logos: ', logos)

		for (const symbol of symbolsToFetch) {
		  const snapshot = snapshots[symbol]; // Adjust based on the actual structure of the response
		  const regularMarketPrice = snapshot.LatestTrade.Price;
		  const regularMarketPreviousClose = snapshot.PrevDailyBar.ClosePrice;
		  const regularMarketChangePercent = ((regularMarketPrice - regularMarketPreviousClose) / regularMarketPreviousClose) * 100;
  
		  const stockData = {
			symbol,
			regularMarketPrice,
			regularMarketPreviousClose,
			regularMarketChangePercent: regularMarketChangePercent.toFixed(2),
		  };
  
		  const cacheKey = symbol + "-quote";
		  stockCache.set(cacheKey, stockData);
		  results.push(stockData);
		}
	  } catch (err) {
		console.error("Error fetching stock data for multiple symbols:", err);
		// Handle the error according to your application's needs, perhaps by marking the failed symbols
		symbolsToFetch.forEach(symbol => results.push({ symbol, error: "Failed to fetch data" }));
	  }
	}
  
	return results; // Return combined results from cache and new fetches
  };

  // determine the timeframe and limit based on the period
  function getTimeframeAndLimit(period: string) {
	switch (period) {
	  case "1d":
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.MIN), limit: 390 }; // Market hours (6.5 hours * 60 min/hour)
	  case "5d":
		return { timeframe: alpaca.newTimeframe(5, alpaca.timeframeUnit.MIN), limit: 390 * 5 };
	  case "1m":
		return { timeframe: alpaca.newTimeframe(30, alpaca.timeframeUnit.MIN), limit: 20 * 21 }; // Approx. 20 trading days in a month
	  case "6m":
	  case "YTD":
	  case "1y":
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY), limit: 365 }; // Daily bars
	  case "all":
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY), limit: 1000 }; // Adjust based on your needs
	  default:
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY), limit: 365 };
	}
  }

function getStartDate(period: string): string {
  const today = new Date();
  switch (period) {
    case "1d":
      // Subtract 1 day from today
      return formatISO(sub(today, { days: 1 }));
    case "5d":
      // Subtract 5 days from today
      return formatISO(sub(today, { days: 5 }));
    case "1m":
      // Subtract 1 month from today
      return formatISO(sub(today, { months: 1 }));
    case "6m":
      // Subtract 6 months from today
      return formatISO(sub(today, { months: 6 }));
    case "YTD":
      // Start of the current year
      return formatISO(new Date(today.getFullYear(), 0, 1));
    case "1y":
      // Subtract 1 year from today
      return formatISO(sub(today, { years: 1 }));
    case "all":
      // Assuming 'all' might represent a significant historical period, like 5 years
      return formatISO(sub(today, { years: 5 }));
    default:
      return formatISO(sub(today, { years: 1 }));
  }
}
  
  export const fetchHistoricalStockData = async (symbol: string, period: "1d" | "5d" | "1m" | "6m" | "YTD" | "1y" | "all" = "1d"): Promise<any> => {
	const { timeframe, limit } = getTimeframeAndLimit(period);
	const cacheKey = `${symbol}-historical-${period}`;
  
	try {
	  if (stockCache.has(cacheKey)) {
		return stockCache.get(cacheKey);
	  } else {
		const endDate = new Date(); //current date
		const startDate = getStartDate(period);

		const bars = alpaca.getBarsV2(symbol, {
		  start: startDate, 
		  end: endDate,
		  timeframe: timeframe,
		  limit: limit,
		});
		const formattedData = [];
		for await (let bar of bars) {
		  formattedData.push({
			Timestamp: bar.Timestamp,
			OpenPrice: bar.OpenPrice,
			HighPrice: bar.HighPrice,
			LowPrice: bar.LowPrice,
			ClosePrice: bar.ClosePrice,
			Volume: bar.Volume,
			VWAP: bar.VWAP,
		  });
		}
		stockCache.set(cacheKey, formattedData);
		return formattedData;
	  }
	} catch (error) {
	  console.error(`Error fetching historical data for ${symbol} - ${period}:`, error);
	  return [];
	}
  }; 

// export const fetchHistoricalStockData = async (
// 	symbol: string,
// 	period: "1d" | "5d" | "1m" | "6m" | "YTD" | "1y" | "all" = "1d",
// ): Promise<any> => {
// 	const periodTerm =
// 		period === "1d" || period === "5d" || period === "1m" ? "short" : "long";
// 	const cacheKey = symbol + "-historical-" + periodTerm;

// 	try {
// 		if (stockCache.has(cacheKey)) {
// 			return stockCache.get(cacheKey);
// 		} else {
// 			let formattedData: number[][] = [];

// 			if (periodTerm == "short") {
// 				// If the period is less than 1 month, use intraday data from Alpha Vantage
// 				let res = await axios.get(
// 					"https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" +
// 						symbol +
// 						"&interval=15min&extended_hours=true&outputsize=full&apikey=" +
// 						process.env.STOTRA_ALPHAVANTAGE_API,
// 				);
// 				const alphaData = res.data["Time Series (15min)"];

// 				if (!alphaData) {
// 					return fetchHistoricalStockData(symbol, "6m");
// 				}

// 				formattedData = Object.keys(alphaData)
// 					.map((key) => {
// 						return [
// 							new Date(key).getTime(),
// 							parseFloat(alphaData[key]["4. close"]),
// 						];
// 					})
// 					.sort((a, b) => a[0] - b[0]);
// 			} else {
// 				const yahooData = await yahooFinance.historical(symbol, {
// 					period1: "2000-01-01",
// 					interval: "1d",
// 				});

// 				formattedData = yahooData.map(
// 					(data: { date: { getTime: () => any }; close: any }) => {
// 						return [data.date.getTime(), data.close];
// 					},
// 				);
// 			}
// 			stockCache.set(cacheKey, formattedData);
// 			return formattedData;
// 		}
// 	} catch (error) {
// 		console.error("Error fetching " + symbol + " historical data:", error);
// 		return null;
// 	}
// };

// export const searchStocks = async (query: string): Promise<any> => {
// 	const queryOptions = {
// 		newsCount: 0,
// 		enableFuzzyQuery: true,
// 		enableNavLinks: false,
// 		enableCb: false,
// 		enableEnhancedTrivialQuery: false,
// 	};

// 	return yahooFinance
// 		.search(query, queryOptions)
// 		.then((results) => {
// 			return results.quotes;
// 		})
// 		.catch((err) => {
// 			if (err.result && Array.isArray(err.result.quotes)) {
// 				return err.result.quotes;
// 			} else {
// 				console.error(err);
// 				throw new Error(err);
// 			}
// 		});
// };

export const searchAssets = async function (searchString: string): Promise<any[]> {
	try {
	  // Directly pass searchString to the Alpaca SDK if supported
	  const assets = await alpaca.getAssets({
		asset: searchString,
	  });
  
	  return assets;
	} catch (error) {
	  console.error('Error searching assets:', error);
	  throw new Error('Failed to search assets');
	}
  }

export const searchAllAssets = async function (searchString: string): Promise<any[]> {
	try {
	  // Fetch all assets that are tradable. You might adjust the status or other filters as needed.
	  const allAssets = await alpaca.getAssets({
		status: 'active', // You can filter by asset status
	  });
  
	  // Filter assets based on the search string. Adjust the criteria as necessary.
	  const filteredAssets = allAssets.filter((asset:any) =>
		asset.symbol.includes(searchString.toUpperCase()) || (asset.name && asset.name.toUpperCase().includes(searchString.toUpperCase()))
	  );
  
	  return filteredAssets;
	} catch (error) {
	  console.error('Error searching assets:', error);
	  throw new Error('Failed to search assets');
	}
  }