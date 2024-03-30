import { useEffect, useReducer, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";

import accounts from "@/api/accounts";
import StockChart from "@/components/stockChart";
import { ArrowDownIcon, ArrowUpIcon, Loader, Minus, Plus } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Transact } from "@/components/transact";

const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

const TradePage = () => {
    const { symbol } = useParams();
	const location = useLocation();

    const [onWatchlist, setOnWatchlist] = useState(false);

    const [stock, setStock] = useReducer(
		(state: any, newState: any) => ({ ...state, ...newState }),
		{
			symbol,
			longName: "",
			regularMarketPrice: -1,
			regularMarketChangePercent: 0,
		},
	);

    useEffect(() => {
		// Check if stock is on watchlist
		// if (tokens.isAuthenticated()) {
			accounts.getWatchlist(true).then((res: any[]) => {
				setOnWatchlist(res.some((stock) => stock.symbol === symbol));
			});
		// }

		axios
			.get(`/api/stocks/${symbol}/info`)
			.then((res) => {
				setStock({ ...res.data });
			})
			.catch((err) => {
				console.log(err);
			});
	}, [location]);

    if(stock.regularMarketPrice < 0){
        return (
            <div>
                <Loader/>
            </div>
        )
    }


    return (
        <>
            {stock.regularMarketPrice > 0 && (
                <div>
                    <div>
                        <Heading title={stock.longName} description={formatter.format(stock.regularMarketPrice)}/>
                        <div>
                            <span className={cn(stock.regularMarketChangePercent > 0 ? 'lime-600' : 'red-600')}>
                                {stock.regularMarketChangePercent > 0 ? (
											<ArrowUpIcon />
										) : (
											<ArrowDownIcon />
										)}
								{stock.regularMarketChangePercent.toFixed(2)}%
                            </span>
                            <span className="gray-500">
                                Today
                            </span>
                        </div>
                    </div>
                    <div>
                       {  (onWatchlist ? (
                            <Button
                                variant={"outline"}
                                onClick={() =>
                                    accounts
                                        .editWatchlist(symbol as string, "remove")
                                        .then(() => setOnWatchlist(false))
                                }
                            >
                                <Minus />
                                Remove from Watchlist
                            </Button>
                        ) : (
                            <Button
                                variant={"outline"}
                                onClick={() =>
                                    accounts
                                        .editWatchlist(symbol as string, "add")
                                        .then(() => setOnWatchlist(true))
                                }
                            >
                                <Plus/>
                                Add to Watchlist
                            </Button>
                        ))}
                    </div>

                        <StockChart symbol={symbol as string} />
                        <Transact symbol={symbol as string} price={stock.regularMarketPrice}/>

                        {/* insert news feed */}

                </div>
            )}
        </>
    );
  }
  
  export default TradePage;