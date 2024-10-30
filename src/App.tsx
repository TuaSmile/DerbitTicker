import React, { useEffect, useState } from 'react';

// Define the types for the WebSocket data
interface MarketData {
  last_price: number;
}

interface SubscriptionResponse {
  method: string;
  params: {
    channel: string;
    data: MarketData;
  };
}

const App: React.FC = () => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    // Use native WebSocket for browser
    const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

    // Subscribe to ticker updates for BTC-PERPETUAL
    const subscribeToTicker = () => {
      const subscriptionMessage = {
        jsonrpc: "2.0",
        id: 8106,  // Use a single unique id for the subscription request
        method: "public/ticker",
        params: {
            instrument_name: ["BTC-PERPETUAL"]
        }
      };
      
      ws.send(JSON.stringify(subscriptionMessage));
    };

    // Handle incoming WebSocket messages
    ws.onmessage = (event: MessageEvent) => {
      const response: SubscriptionResponse = JSON.parse(event.data);
      console.log("Data Display");
      console.log(response);
      if (response.method === 'subscription') {
        const marketData: MarketData = response.params.data;
        setPrice(marketData.last_price);
      }
    };

    // Open WebSocket connection and subscribe
    ws.onopen = () => {
      console.log('WebSocket connection established.');
      subscribeToTicker();
    };

    // Handle WebSocket close
    ws.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    // Handle WebSocket errors
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup WebSocket on component unmount
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="App">
      <h1>BTC-PERPETUAL Price</h1>
      <p>{price ? `$${price.toFixed(2)}` : 'Loading...'}</p>
    </div>
  );
};

export default App;