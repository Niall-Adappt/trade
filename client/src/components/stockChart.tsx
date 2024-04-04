import { useState, useRef, useEffect } from "react";
import * as Highcharts from "highcharts/highstock";
import highchartsAccessibility from "highcharts/modules/accessibility";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";
import { useLocation } from "react-router-dom";
// import { Box, Spinner, useTheme } from "@chakra-ui/react";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
// import { useColorMode } from "@chakra-ui/react";

const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export default function StockChart(props: { symbol: string }) {
	const location = useLocation();
	const [isLoading, setIsLoading] = useState(true);
	const [chartData, setChartData] = useState<any[]>([]);

	// const accentColor =
	// 	useTheme()["components"]["Link"]["baseStyle"]["color"].split(".")[0];
	// const chartAccentColor = "var(--chakra-colors-" + accentColor + "-500)";

	const fetchStockData = async (period: string = "1m") => {
		const backendUrl = import.meta.env.VITE_BACKEND_URL;
		setIsLoading(true);
		try {
			const response = await axios(`${backendUrl}/stock/historical/${props.symbol}?period=${period}`);
			const formattedData = response.data.map((item: any) => {
				const x = Date.parse(item.Timestamp); // For timestamp
				const y = item.VWAP;
				return [x, y];
			});
	
			setChartData(formattedData); // Update chart data state
			if(chartComponentRef.current && chartComponentRef.current.chart) {
				const chart = chartComponentRef.current.chart;
				
				const xMin = chart.series[0].data[0].x; // x value of the first point in the series
				const xMax = chart.series[0].data[chart.series[0].data.length - 1].x; // x value of the last point
			
				chart.xAxis[0].setExtremes(xMin, xMax, true, false);
			}
		} catch (error) {
			console.error('Error fetching stock data:', error);
		} finally {
			setIsLoading(false);
		}
	};
	const zoomBtnClick = async function (this: any) {
		let thisBtn = this as {
			click: () => void;
			text: string;
		};
		await fetchStockData(thisBtn.text); // Wait for data fetching to complete
	};

	const [options, setOptions] = useState<Highcharts.Options>({
		rangeSelector: {
			allButtonsEnabled: true,
			inputStyle: {
				// color: chartAccentColor,
				fontWeight: "bold",
			},
			buttons: [
				{
					type: "day",
					count: 1,
					text: "1d",
					title: "View 1 day",
					events: { click: zoomBtnClick },
				},
				{
					type: "day",
					count: 5,
					text: "5d",
					title: "View 5 days",
					events: { click: zoomBtnClick },
				},
				{
					type: "month",
					count: 1,
					text: "1m",
					title: "View 1 month",
					events: { click: zoomBtnClick },
				},
				{
					type: "month",
					count: 6,
					text: "6m",
					title: "View 6 months",
					events: { click: zoomBtnClick },
				},
				{
					type: "ytd",
					text: "YTD",
					title: "View year to date",
					events: { click: zoomBtnClick },
				},
				{
					type: "year",
					count: 1,
					text: "1y",
					title: "View 1 year",
					events: { click: zoomBtnClick },
				},
				{
					type: "all",
					text: "All",
					title: "View all",
					events: { click: zoomBtnClick },
				},
			],
		},
		// colors: [chartAccentColor],
		title: {
			text: "",
		},
		yAxis: [
			{
				height: "75%",
				labels: {
					formatter: (point: any) => formatter.format(point.value as number),
					x: -5,
					align: "left",
				},
				title: {
					text: " ",
				},
			},
		],
		plotOptions: {
			series: {
				showInNavigator: true,
				gapSize: 0,
			},
		},
		chart: {
			height: 600,
			borderRadius: 10,
			// backgroundColor: "transparent",

			style: {
				fontFamily: "'Manrope Variable', sans-serif",
				fontWeight: "600",
				color: "red",
			},
		},
		credits: {
			enabled: false,
		},
		xAxis: {
			type: "datetime",
		},
		navigator: {
			maskFill: "rgb(49, 130, 206, 0.25)",
			series: {
				// color: chartAccentColor,
				fillOpacity: 0.1,
				lineWidth: 2,
			},
		},
	} as any);

	const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

	highchartsAccessibility(Highcharts);

	// useEffect(() => {
	// 	options.chart!.style!.color = colorMode === "light" ? "black" : "white";
	// 	chartComponentRef.current?.chart?.update(options);
	// 	console.log("updates");
	// }, [colorMode]);

	
useEffect(() => {
    // Update the chart options any time the chartData state changes
    setOptions((prevOptions) => ({
        ...prevOptions,
        series: [
            {
                name: "Price",
                type: "spline",
                id: "stock_chart",
                data: chartData, // Use state-managed chart data
                lineWidth: 2,
                tooltip: {
                    valueDecimals: 2,
                },
            },
        ],
    }));
	
}, [chartData]);

	useEffect(() => {
		fetchStockData();
	}, [location]);

	return (
		<>
			{isLoading && <Loader/>}
			<div className={cn(isLoading ? "none" : "block")}>
				<HighchartsReact
					constructorType={"stockChart"}
					highcharts={Highcharts}
					options={options}
					ref={chartComponentRef}
				/>
			</div>
		</>
	);
}
