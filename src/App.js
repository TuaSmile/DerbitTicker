import React from 'react';
import PriceChart from './components/PriceChart';

function App() {
  return (
    <div style={{paddingTop: '50px', textAlign:'center'}}>
        {/* <h1>Deribit BTC Price Tracker</h1> */}
        <PriceChart />
    
    </div>
  );
}

export default App;