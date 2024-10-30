import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';

// WebSocket endpoint for Deribit API
const DERIBIT_WS_URL = process.env.DERIBIT_WS_URL || 'wss://test.deribit.com/ws/api/v2';

const PriceChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const markPriceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lastPriceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [markPrice, setMarkPrice] = useState<number | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  const getChartWidth = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    return {
      width: screenWidth - 50,
      height: screenHeight - 50,
    };
  };

  useLayoutEffect(() => {
    if (chartContainerRef.current) {
      const { width, height } = getChartWidth();
      const chart = createChart(chartContainerRef.current, {
        width: width,
        height: height,
        layout: {
          background: { color: '#141414' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: {
            color: '#444',
          },
          horzLines: {
            color: '#444',
          },
        },
      });

      // Add a line series for mark price
      const markPriceSeries = chart.addLineSeries({
        color: '#FF0000', // Red color
        lineWidth: 2,
      });

      // Add a line series for last price
      const lastPriceSeries = chart.addLineSeries({
        color: '#0000FF', // Blue color
        lineWidth: 2,
      });

      // Set initial placeholder data
      markPriceSeries.setData([{ time: Math.floor(Date.now() / 1000) as Time, value: 61200 }]);
      lastPriceSeries.setData([{ time: Math.floor(Date.now() / 1000) as Time, value: 61200 }]);

      markPriceSeriesRef.current = markPriceSeries;
      lastPriceSeriesRef.current = lastPriceSeries;

      chart.priceScale('right').applyOptions({
        autoScale: true,
      });

      const resizeObserver = new ResizeObserver(() => {
        if (chartContainerRef.current) {
          chartRef.current?.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      });

      resizeObserver.observe(chartContainerRef.current);
      chartRef.current = chart;

      return () => {
        resizeObserver.disconnect();
        chart.remove();
      };
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(DERIBIT_WS_URL);

    let lastTimestamp = 0 as Time;

    ws.onopen = () => {
      setInterval(() => {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 8106,
            method: 'public/ticker',
            params: {
              instrument_name: 'BTC-PERPETUAL',
            },
          })
        );
      }, 1000);
      console.log('Connected to Deribit WebSocket');
    };

    ws.onmessage = (event: MessageEvent) => {
      const response = JSON.parse(event.data);

      if (response.result && response.result.last_price && response.result.timestamp) {
        const { mark_price, last_price, timestamp } = response.result;
        console.log(response.result);
        const newTime = Math.floor(timestamp / 1000) as Time;

        if (newTime > lastTimestamp) {
          lastTimestamp = newTime;

          setMarkPrice(mark_price);
          setLastPrice(last_price);

          const newMarkPricePoint: LineData = {
            time: newTime,
            value: mark_price,
          };

          const newLastPricePoint: LineData = {
            time: newTime,
            value: last_price,
          };

          if (markPriceSeriesRef.current) {
            const oldMarkPriceData = markPriceSeriesRef.current.data() as LineData[];
            const updatedMarkPriceData = [...oldMarkPriceData, newMarkPricePoint];
            updatedMarkPriceData.sort((a, b) => Number(a.time) - Number(b.time));
            markPriceSeriesRef.current.setData(updatedMarkPriceData);
          }

          if (lastPriceSeriesRef.current) {
            const oldLastPriceData = lastPriceSeriesRef.current.data() as LineData[];
            const updatedLastPriceData = [...oldLastPriceData, newLastPricePoint];
            updatedLastPriceData.sort((a, b) => Number(a.time) - Number(b.time));
            lastPriceSeriesRef.current.setData(updatedLastPriceData);
          }
        }
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Deribit WebSocket');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{display: 'flex', gap: '20px'}}>
        <div style={{ color: '#F00', fontSize: '18px', marginBottom: '10px' }}>
          Current Price: {markPrice !== null ? `$${markPrice.toFixed(2)}` : 'Loading...'}
        </div>
        <div style={{ color: '#00F', fontSize: '18px', marginBottom: '10px' }}>
          Last Price: {lastPrice !== null ? `$${lastPrice.toFixed(2)}` : 'Loading...'}
        </div>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default PriceChart;