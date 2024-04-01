const WebSocket = require('ws');

//add function to manage subscriptions based on watchlist and if there is a stock open. for now just add all open stocks to wish list to simplify logic or add some logic to update the websocket subscripption eg if the stock is selected create a temporary subscription spot for it in the schema

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

    let wssAlpaca: any

    // Function to handle the setup of the Alpaca WebSocket
    function setupAlpacaWebSocket() {
        //initiate Alpaca websocket
        wssAlpaca = new WebSocket(process.env.APACA_URL) //wss://stream.data.alpaca.markets/v2/test available outside market hrs 'wss://paper-api.alpaca.markets/stream' sip or iex - sip is all exchanges
            
        wssAlpaca.on('open', function(){
          console.log('websocket connected: Server - Alpaca');
        
          const authMsg = {
            "action": "auth",
            "key": process.env.APACA_API_KEY_ID,
            "secret": process.env.APACA_API_SECRET_KEY,
          }
          wssAlpaca.send(JSON.stringify(authMsg))
        
          // const subscribeMsg = {
          //   action: 'subscribe',
          //   news: ['*'], //['TSLA',...]
        
          // }
          const subscribeMsg = {
            action:   'subscribe',
            trades:   ["AAPL"],
            // quotes :  ["AMD","CLDR"],
            // bars:     ["*"]
        
          }
          wssAlpaca.send(JSON.stringify(subscribeMsg))
        })
        
        //when Alpaca sends messages
        wssAlpaca.on('message', function(message:any){
          console.log('alpac message is: ', message);
          // const currentEvent = JSON.parse(message)[0]
        
            // Broadcast the received data to all connected clients
            wssServer.clients.forEach(function(client:any) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            });
        })

        // Handle the close event
        wssAlpaca.on('close', function() {
            console.log('Alpaca WebSocket closed. Attempting to reconnect...');
            // Implement reconnection logic here. For instance:
            setTimeout(() => {
                wssAlpaca = setupAlpacaWebSocket(); // Attempt to reconnect
            }, 5000); // Reconnect after 5 seconds
        });

        return wssAlpaca;
    }
    setupAlpacaWebSocket(); // Call setup function directly to initiate connection
    
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
      wssAlpaca.close(); // Close the Alpaca WebSocket connection
      console.log('Cleaned up WebSockets.');
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    return wssServer; //return this if need to use elsewhere
}