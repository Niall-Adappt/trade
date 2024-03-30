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

interface TransactProps {
    symbol: string
    price: number
}

const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export const Transact: React.FC<TransactProps> = ({symbol, price}) => {
    const [shares, setShares] = useState(1);
	const [buyingPower, setBuyingPower] = useState(0);
	const [availableShares, setAvailableShares] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

    const location = useLocation();

	// const toast = useToast();

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
				accounts.getBuyingPower().then((value) => {
					setBuyingPower(value);
				});
				accounts.getAvailableShares(symbol).then((value) => {
					setAvailableShares(value);
				});
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

    useEffect(() => {
		accounts.getBuyingPower().then((value) => {
			setBuyingPower(value);
		});

		accounts.getAvailableShares(symbol!).then((value) => {
			console.log(symbol!, value);
			setAvailableShares(value);
		});
	}, [location]);

    return (
        <Tabs defaultValue="buy" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy">
            <Card>
              <CardHeader>
                <CardTitle>Buy {symbol}</CardTitle>
                <CardDescription>
                  Purchase shares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="shares">Shares</Label>
                  <Input id="shares" type="number" defaultValue={1} onChange={(e) => setShares(parseInt(e.target.value))}/>
                </div>
                <div className="space-y-1">
                    <span>Current price</span>
                    <span>{formatter.format(price)}</span>
                </div>
                <div className="space-y-1">
                    <span>Estimated total</span>
                    <span>{formatter.format(price*shares)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled={isLoading} onClick={() => submitTransaction(symbol, shares, true)}>Buy</Button>
                <span>Available funds: {formatter.format(buyingPower)}</span>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="sell">
            <Card>
              <CardHeader>
                <CardTitle>Sell</CardTitle>
                <CardDescription>
                  Sell shares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="shares">Shares</Label>
                  <Input id="shares" type="number" defaultValue={1} onChange={(e) => setShares(parseInt(e.target.value))}/>
                </div>
                <div className="space-y-1">
                    <span>Current price</span>
                    <span>{formatter.format(price)}</span>
                </div>
                <div className="space-y-1">
                    <span>Estimated total</span>
                    <span>{formatter.format(price*shares)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled={isLoading} onClick={() => submitTransaction(symbol, shares, false)}>Sell</Button>
                <span>{availableShares} shares available</span>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )
} 