import React from 'react';
import { Database, HardDrive, Network } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface SystemMetricsProps {
  systemData: {
    timestamp: number[];
    download: number[];
    upload: number[];
    cpu: number[];
    memory: {
      used: number[];
      total: number;
    };
    disk: {
      used: number[];
      total: number;
      path: string;
    };
  };
}

const formatBytes = (bytes: number) => {
  const gigabytes = bytes / (1024 * 1024 * 1024);
  return `${gigabytes.toFixed(1)} GB`;
};

const formatSpeed = (bytesPerSecond: number) => {
  if (bytesPerSecond >= 1024 * 1024) {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  if (bytesPerSecond >= 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${Math.round(bytesPerSecond)} B/s`;
};

const MetricBlock = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue = '', 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subValue?: string;
  color: string;
}) => (
  <div className="bg-gray-800 rounded-lg p-3 h-[88px]">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-gray-400 text-sm">{label}</h3>
        <p className="text-lg font-bold">{value}</p>
        {subValue && <span className="text-gray-400 text-xs">{subValue}</span>}
      </div>
    </div>
  </div>
);

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export function SystemMetrics({ systemData }: SystemMetricsProps) {
  const currentMemoryUsed = systemData.memory.used[systemData.memory.used.length - 1] || 0;
  const freeSpace = systemData.disk.total - (systemData.disk.used[systemData.disk.used.length - 1] || 0);
  const currentDownload = systemData.download[systemData.download.length - 1] || 0;
  const currentUpload = systemData.upload[systemData.upload.length - 1] || 0;

  const cpuChartOption: EChartsOption = {
    title: {
      text: 'CPU Usage',
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
        const usage = params[0].value[1];
        return `${formatTime(timestamp)}<br/>
                CPU: ${usage.toFixed(1)}%`;
      },
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      borderColor: '#818cf8',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '12%',
      top: '20%',
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
        fontSize: 10
      },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: true, lineStyle: { color: '#4b5563' } },
      axisTick: { show: true, lineStyle: { color: '#4b5563' } },
      splitLine: {
        show: true,
        lineStyle: { color: '#374151', type: 'dashed' }
      },
      axisLabel: {
        color: '#9ca3af',
        formatter: '{value}%',
        fontSize: 10
      }
    },
    series: [
      {
        name: 'CPU Usage',
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
              { offset: 0, color: 'rgba(129, 140, 248, 0.3)' },
              { offset: 1, color: 'rgba(129, 140, 248, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#818cf8',
          width: 2
        },
        data: systemData.timestamp.map((time, index) => [
          time,
          systemData.cpu[index]
        ])
      }
    ],
    backgroundColor: 'transparent'
  };

  const networkChartOption: EChartsOption = {
    title: {
      text: 'Network Usage',
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
        const download = formatSpeed(params[0].value[1]);
        const upload = formatSpeed(params[1].value[1]);
        return `${formatTime(timestamp)}<br/>
                Download: ${download}<br/>
                Upload: ${upload}`;
      },
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      borderColor: '#4299e1',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['Download', 'Upload'],
      top: 25,
      textStyle: { color: '#9ca3af', fontSize: 10 }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '12%',
      top: '25%',
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
        fontSize: 10
      },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: true, lineStyle: { color: '#4b5563' } },
      axisTick: { show: true, lineStyle: { color: '#4b5563' } },
      splitLine: {
        show: true,
        lineStyle: { color: '#374151', type: 'dashed' }
      },
      axisLabel: {
        color: '#9ca3af',
        formatter: (value: number) => formatSpeed(value),
        fontSize: 10
      }
    },
    series: [
      {
        name: 'Download',
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
              { offset: 0, color: 'rgba(52, 211, 153, 0.3)' },
              { offset: 1, color: 'rgba(52, 211, 153, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#34d399',
          width: 2
        },
        data: systemData.timestamp.map((time, index) => [
          time,
          systemData.download[index]
        ])
      },
      {
        name: 'Upload',
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
              { offset: 0, color: 'rgba(248, 113, 113, 0.3)' },
              { offset: 1, color: 'rgba(248, 113, 113, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#f87171',
          width: 2
        },
        data: systemData.timestamp.map((time, index) => [
          time,
          systemData.upload[index]
        ])
      }
    ],
    backgroundColor: 'transparent'
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
      {/* Mobile: Full width CPU chart */}
      <div className="w-full lg:col-span-1">
        <div className="bg-gray-800 rounded-lg p-2 md:p-3">
          <ReactECharts
            option={cpuChartOption}
            style={{ height: '160px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
          />
        </div>
      </div>

      {/* Mobile: Memory and Free Space in one row */}
      <div className="grid grid-cols-2 gap-3 lg:col-span-1">
        <MetricBlock
          icon={Database}
          label="Memory"
          value={formatBytes(currentMemoryUsed)}
          subValue={`of ${formatBytes(systemData.memory.total)}`}
          color="bg-rose-500/20 text-rose-400"
        />
        <MetricBlock
          icon={HardDrive}
          label="Free Space"
          value={formatBytes(freeSpace)}
          subValue={`of ${formatBytes(systemData.disk.total)}`}
          color="bg-amber-500/20 text-amber-400"
        />
      </div>

      {/* Mobile: Full width Network chart */}
      <div className="w-full lg:col-span-1">
        <div className="bg-gray-800 rounded-lg p-2 md:p-3">
          <ReactECharts
            option={networkChartOption}
            style={{ height: '160px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
          />
        </div>
      </div>

      {/* Mobile: Download and Upload in one row */}
      <div className="grid grid-cols-2 gap-3 lg:col-span-1">
        <MetricBlock
          icon={Network}
          label="Download"
          value={formatSpeed(currentDownload)}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <MetricBlock
          icon={Network}
          label="Upload"
          value={formatSpeed(currentUpload)}
          color="bg-red-500/20 text-red-400"
        />
      </div>
    </div>
  );
}