import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface BitrateGraphProps {
  data: {
    timestamp: number[];
    videoBitrate: number[];
  };
}

export function BitrateGraph({ data }: BitrateGraphProps) {
  const TWO_MINUTES = 2 * 60 * 1000;

  const processData = () => {
    if (!data.timestamp.length) return [];
    
    const now = data.timestamp[data.timestamp.length - 1];
    const twoMinutesAgo = now - TWO_MINUTES;
    
    const recentData: [number, number][] = [];
    for (let i = data.timestamp.length - 1; i >= 0; i--) {
      if (data.timestamp[i] < twoMinutesAgo) break;
      recentData.unshift([data.timestamp[i], data.videoBitrate[i]]);
    }
    
    return recentData;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const option: EChartsOption = {
    title: {
      text: 'Video Bitrate History (Last 2 Minutes)',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const timestamp = params[0].value[0];
        const bitrate = params[0].value[1];
        return `${formatTime(timestamp)}<br/>
                Bitrate: ${(bitrate / 1000000).toFixed(2)} Mbps`;
      },
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      borderColor: '#4299e1',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '8%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLine: { show: true, lineStyle: { color: '#4b5563' } },
      axisTick: { show: true, lineStyle: { color: '#4b5563' } },
      axisLabel: {
        color: '#9ca3af',
        formatter: (value: number) => formatTime(value),
        fontSize: 10,
        showMaxLabel: true,
        showMinLabel: true
      },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax'
    },
    yAxis: {
      type: 'value',
      name: 'Mbps',
      nameTextStyle: {
        color: '#9ca3af',
        padding: [0, 0, 0, 40],
        fontSize: 10
      },
      axisLine: { show: true, lineStyle: { color: '#4b5563' } },
      axisTick: { show: true, lineStyle: { color: '#4b5563' } },
      splitLine: {
        show: true,
        lineStyle: { color: '#374151', type: 'dashed' }
      },
      axisLabel: {
        color: '#9ca3af',
        formatter: (value: number) => `${(value / 1000000).toFixed(1)}`,
        fontSize: 10
      }
    },
    series: [
      {
        name: 'Video Bitrate',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'lttb',
        animation: false,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(66, 153, 225, 0.3)' },
              { offset: 1, color: 'rgba(66, 153, 225, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#4299e1',
          width: 2
        },
        data: processData()
      }
    ],
    backgroundColor: 'transparent',
    textStyle: { color: '#fff' }
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg p-3">
      <ReactECharts
        option={option}
        style={{ height: '180px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
      />
    </div>
  );
}