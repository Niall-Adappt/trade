import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import accounts from "@/api/accounts";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import api from "@/api";

interface TransactProps {
    symbol: string
}

const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export const Transact: React.FC<TransactProps> = ({symbol}) => {
    const [shares, setShares] = useState(1);
	const [buyingPower, setBuyingPower] = useState(0);
	const [availableShares, setAvailableShares] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
	// const toast = useToast();
  const [tickerData, setTickerData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [wssPrice, setWssPrice] = useState<number | null>(null);
  const ticker: string = symbol

      //account data
      const fetchAccountData = async () => { 
        try {
          setIsLoading(true);
          const responseBuyingPower = await accounts.getBuyingPower()
          const responseAvailableShares = await accounts.getAvailableShares(symbol!)
          setAvailableShares(responseAvailableShares);
          setBuyingPower(responseBuyingPower);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false)
        }
      }
  
      //stock data
      const fetchStockData = async () => { 
        try {
          setIsLoading(true);
          const tickerInformation = await api.getTickerData(symbol);
          setTickerData(tickerInformation);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false)
        }
      }

  //fetch data
  useEffect(() => {

    fetchStockData();
    fetchAccountData()

    // WebSocket connection
    const backendWsUrl = import.meta.env.VITE_BACKEND_WS_URL;
    const ws = new WebSocket(backendWsUrl);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      ws.send(JSON.stringify({ action: 'subscribe', ticker: symbol })); // Subscribe to ticker updates
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Assuming the message format is { ticker: string, price: number }
      if (message.s.toUpperCase() === symbol.toLocaleUpperCase() && ['b', 'd', 'u'].includes(message.T) ) {
        setWssPrice(message.price); // Update price from WebSocket
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close(); // Clean up WebSocket connection
      console.log('WebSocket Disconnected');
    };
  }, [symbol, location]);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
    if (!isMounted || !tickerData) {
      return null;
    }

  // if (!name && !logo && !sector) return null;
  const  { price, changePercent, prevOpen, prevClose } = tickerData
  const displayPrice  = wssPrice || price

	const submitTransaction = (
		symbol: string,
		quantity: number,
		isBuy: boolean
	) => {
		setIsLoading(true);
		accounts
			.makeTransaction(symbol, quantity, isBuy ? "buy" : "sell")
			.then(() => {
				// Show success toast on successful transaction
				// toast({
				// 	title: "Transaction submitted",
				// 	description: isBuy
				// 		? "Bought "
				// 		: "Sold " + quantity + " shares of " + symbol,
				// 	status: "success",
				// });
				// Update buying power and available shares
        fetchAccountData()
        fetchStockData()
				// accounts.getBuyingPower().then((value) => {
				// 	setBuyingPower(value);
				// });
				// accounts.getAvailableShares(symbol).then((value) => {
				// 	setAvailableShares(value);
				// });
				// Turn off button spinner
				setIsLoading(false);
			})
			.catch((err) => {
				// Show error toast on failed transaction
				// toast({
				// 	title: "Error " + isBuy ? "buying" : "selling" + " " + symbol,
				// 	description: err.message,
				// 	status: "error",
				// });
				// Turn off button spinner
				setIsLoading(false);
			});
	}

  //   useEffect(() => {

	// }, [location]);
  const logo = `https://s3.polygon.io/logos/${symbol.toLowerCase()}/logo.png`
    return (
        <Tabs defaultValue="buy" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent className="h-full" value="buy">
            <Card className="h-full" >
              <CardHeader>
              <img
                  className='ticker-logo mx-auto pb-2'
                  src={logo}
                  alt={`stock logo(${symbol})`}
                  width="100"
              />
                <CardTitle>Buy {symbol}</CardTitle>
                <CardDescription>
                  Purchase shares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="shares">Shares</Label>
                  <Input key={location.pathname} id="shares" type="number" defaultValue={1} onChange={(e) => setShares(parseInt(e.target.value))}/>
                </div>
                <div className="space-y-1 pt-3">
                    <span>Current price: </span>
                    <span className="text-xl font-bold">{formatter.format(displayPrice)}</span>
                </div>
                <div className="space-y-1">
                    <span>Estimated total: </span>
                    <span className="text-xl font-bold">{formatter.format(displayPrice*shares)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex flex-col mx-auto w-full">
                  <Button disabled={isLoading} onClick={() => submitTransaction(symbol, shares, true)}>Buy</Button>
                  <span className="pt-5">Available funds: {formatter.format(buyingPower)}</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent className='h-full' value="sell">
            <Card className='h-full'>
              <CardHeader>
              <img
                  className='ticker-logo mx-auto pb-2'
                  src={logo}
                  alt={`stock logo(${symbol})`}
                  width="100"
              />
                <CardTitle>Sell {symbol}</CardTitle>
                <CardDescription>
                  Sell shares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="shares">Shares</Label>
                  <Input id="shares" type="number" defaultValue={1} onChange={(e) => setShares(parseInt(e.target.value))}/>
                </div>
                <div className="space-y-2 pt-3">
                    <span>Current price: </span>
                    <span className="text-xl font-bold">{formatter.format(displayPrice)}</span>
                </div>
                <div className="space-y-1">
                    <span>Estimated total: </span>
                    <span className="text-xl font-bold">{formatter.format(displayPrice*shares)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex flex-col mx-auto w-full">
                  <Button disabled={isLoading} onClick={() => submitTransaction(symbol, shares, false)}>Sell</Button>
                  <span className="pt-5">{availableShares} shares available</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )
} 