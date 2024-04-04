const WebSocket = require('ws');
import { botBuyStock } from "../utils/requests";
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY 
});

// const message = await anthropic.messages.create({
//   max_tokens: 1024,
//   messages: [{ role: 'user', content: 'Hello, Claude' }],
//   model: 'claude-3-opus-20240229',
// });
interface ChatGPTResponse {
  choices: Choice[];
}

interface Choice {
  message: Message;
}

interface Message {
  content: string;
}

export function setupWebSocketServer(httpServer: any) {
  // attach WebSocket server to existing HTTP server so they share the same port
    const wssServer = new WebSocket.Server({ server: httpServer });

    //when client intiates connection with websocket
    wssServer.on('connection', function(ws: any) {
      console.log('Client connected to server');

      ws.on('message', function(message: any) {
        console.log('Received message from client:', message);
      });

      // Handle WebSocket closing from client side
      ws.on('close', function(code?:any, reason?:any) {
        console.log(`Client disconnected: ${code} - ${reason}`);
      });
    });

    let wssAlpacaBars: any
    let wssAlpacaNews: any

    // Function to handle the setup of the alpaca WebSocket
    function setupAlpacaNewsWebSocket() {
      //initiate Alpaca websocket
      wssAlpacaNews = new WebSocket("wss://stream.data.alpaca.markets/v1beta1/news") //("wss://stream.data.alpaca.markets/v2/test") //("wss://stream.data.alpaca.markets/v2/test") //wss://stream.data.alpaca.markets/v2/test available outside market hrs //process.env.APCA_URL 'wss://paper-api.alpaca.markets/stream' sip or iex - sip is all exchanges
          
      wssAlpacaNews.on('open', function(){
        console.log('websocket connected: Server - Alpaca');
        const key = process.env.APCA_API_KEY_ID
        const secret = process.env.APCA_API_SECRET_KEY
        const authMsg = {
          "action": "auth",
          "key": key, 
          "secret": secret
        }
        wssAlpacaNews.send(JSON.stringify(authMsg))
      
        const subscribeMsg = {
          action:   'subscribe',
          news: ["*"]
        }
        wssAlpacaNews.send(JSON.stringify(subscribeMsg))
      })
      
      //when Alpaca sends messages
      wssAlpacaNews.on('message', async function(message: Buffer){
        const messageText = message.toString('utf8'); // Convert buffer to string
        console.log('Alpaca message in plain text:', messageText);
      
        // Parse the JSON string to an object
        try {
            const messageArr = JSON.parse(messageText);
            console.log('Parsed message:', messageArr);

            const currentEvent = messageArr[0]

            if(currentEvent.T === 'n'){
              //query chat gpt to rank out of 100
              let companyImpact = 0;
              const apiReqBody = {
                "model": "gpt-3.5-turbo",
                "messages": [
                  { role: "system", content: "As if you were thinking as an expert financial analyst. Only respond with a number from 0-100 detailing the impact of the headline (100 being most positive and 0 most negative)." }, 
                  { role: "user", content: "Given the headline '" + currentEvent.headline + "', show me a number from 1-100 detailing the impact of this headline on the mentioned companies or sectors."}
              ]
              }

              await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + process.env.OPENAI_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(apiReqBody)
            }).then((data) => {
                return data.json();
            }).then((data: any) => {
                // data is the ChatGPT response
                const response = data as ChatGPTResponse;
                const content = response?.choices?.[0]?.message?.content ?? '50'; //default neutral or throw error
                console.log(response);
                console.log(content);
                const companyImpact = parseInt(content);
            });

              //trade based on output if greater than 40 buy stock less than 30 sell stock
              const tickerSymbol = currentEvent.symbols[0];
              if(companyImpact >= 40) { 
                // Buy stock
                const res = await botBuyStock(tickerSymbol)
                console.log('botBuyStock result: ', res?.message)
            } else if (companyImpact <= 30) { 
                // Sell stock
                console.log(`Sell ${tickerSymbol} now`)
                // let closedPosition = alpaca.closePosition(tickerSymbol); //(tickerSymbol);
            }

            }
            
            // Broadcast the received data to all connected clients in plain text
            wssServer.clients.forEach(function(client: any) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageText); // Send as plain text
                }
            });
        } catch (error) {
            console.error('Error parsing message from Alpaca:', error);
        }
    });

      // Handle the close event
      wssAlpacaNews.on('close', function() {
          console.log('Alpaca WebSocket closed. Attempting to reconnect...');
          // Implement reconnection logic here. For instance:
          setTimeout(() => {
              wssAlpacaNews = setupAlpacaNewsWebSocket(); // Attempt to reconnect
          }, 5000); // Reconnect after 5 seconds
      });

      return wssAlpacaNews;
  }


    function setupAlpacaBarsWebSocket() {
        //initiate Alpaca websocket
        wssAlpacaBars = new WebSocket("wss://stream.data.alpaca.markets/v2/test")//("wss://stream.data.alpaca.markets/v1beta1/news") //("wss://stream.data.alpaca.markets/v2/test") //wss://stream.data.alpaca.markets/v2/test available outside market hrs //process.env.APCA_URL 'wss://paper-api.alpaca.markets/stream' sip or iex - sip is all exchanges
        wssAlpacaBars = new WebSocket("wss://stream.data.alpaca.markets/v2/iex")

        wssAlpacaBars.on('open', function(){
          console.log('websocket connected: Server - Alpaca');
          const key = process.env.APCA_API_KEY_ID
          const secret = process.env.APCA_API_SECRET_KEY
          const authMsg = {
            "action": "auth",
            "key": key, 
            "secret": secret
          }
          wssAlpacaBars.send(JSON.stringify(authMsg))
        
          const subscribeMsg = {
            action:   'subscribe',
            bars:   ["*"],
            // news: ["*"]
            // quotes :  ["AMD","CLDR"],
            // trades:     ["*"]
        
          }
          wssAlpacaBars.send(JSON.stringify(subscribeMsg))
        })
        
        //when Alpaca sends messages
        wssAlpacaBars.on('message', function(message: Buffer){
          const messageText = message.toString('utf8'); // Convert buffer to string
          console.log('Alpaca message in plain text:', messageText);
        
          // Parse the JSON string to an object
          try {
              const messageObj = JSON.parse(messageText);
              console.log('Parsed message:', messageObj);
              
              // Broadcast the received data to all connected clients in plain text
              wssServer.clients.forEach(function(client: any) {
                  if (client.readyState === WebSocket.OPEN) {
                      client.send(messageText); // Send as plain text
                  }
              });
          } catch (error) {
              console.error('Error parsing message from Alpaca:', error);
          }
      });

        // Handle the close event
        wssAlpacaBars.on('close', function() {
            console.log('Alpaca WebSocket closed. Attempting to reconnect...');
            // Implement reconnection logic here. For instance:
            setTimeout(() => {
                wssAlpacaBars = setupAlpacaBarsWebSocket(); // Attempt to reconnect
            }, 5000); // Reconnect after 5 seconds
        });

        return wssAlpacaBars;
    }

    wssAlpacaBars = setupAlpacaBarsWebSocket();
    wssAlpacaNews = setupAlpacaNewsWebSocket();
    
    wssServer.on('error', function(error: any) {
      console.error('WebSocket error on server:', error);
    });

      // Cleanup logic for when the server shuts down
    function cleanup() {
      wssServer.clients.forEach(function(client:any) {
        if (client.readyState === WebSocket.OPEN) {
          // Optionally, send a message to clients indicating the server is shutting down
          client.close(1001, 'Server shutting down'); // 1001 indicates going away
        }
      });
      wssAlpacaNews.close(); 
      wssAlpacaBars.close(); // Close the Alpaca WebSocket connection
      console.log('Cleaned up WebSockets.');
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    return wssServer; //return this if need to use elsewhere
}