import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendData, CostBreakdown, BudgetVsActual, CashFlowProjection } from '@/types/costControl';

// Color palette
const COLORS = {
  primary: '#3B82F6', // blue
  secondary: '#10B981', // green
  accent: '#8B5CF6', // purple
  warning: '#F59E0B', // orange
  danger: '#EF4444', // red
  gray: '#6B7280',
  success: '#22C55E',
};

const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // orange
  '#EF4444', // red
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange-red
];

// Custom tooltip formatter for currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

// Custom tooltip formatter for percentages
const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Custom tooltip component for EVM chart
const EVMTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip component for performance indicators
const PerformanceTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toFixed(3)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip component for cash flow
const CashFlowTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface EVMChartProps {
  data: TrendData[];
  height?: number;
}

const EVMChartComponent: React.FC<EVMChartProps> = ({ data, height = 400 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
        />
        <Tooltip content={<EVMTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="pv"
          name="Planned Value (PV)"
          stroke={COLORS.secondary}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="ev"
          name="Earned Value (EV)"
          stroke={COLORS.primary}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="ac"
          name="Actual Cost (AC)"
          stroke={COLORS.danger}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="forecastEAC"
          name="Forecast EAC"
          stroke={COLORS.accent}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const EVMChart = React.memo(EVMChartComponent, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && prevProps.height === nextProps.height;
});

interface PerformanceIndexChartProps {
  data: TrendData[];
  height?: number;
}

const PerformanceIndexChartComponent: React.FC<PerformanceIndexChartProps> = ({
  data,
  height = 300,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} domain={[0, 2]} />
        <Tooltip content={<PerformanceTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="cpi"
          name="CPI (Cost Performance Index)"
          stroke={COLORS.primary}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="spi"
          name="SPI (Schedule Performance Index)"
          stroke={COLORS.secondary}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        {/* Reference line at 1.0 */}
        <Line
          type="monotone"
          dataKey={() => 1}
          name="Target (1.0)"
          stroke={COLORS.gray}
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export const PerformanceIndexChart = React.memo(PerformanceIndexChartComponent, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && prevProps.height === nextProps.height;
});

interface BudgetVsActualChartProps {
  data: BudgetVsActual[];
  height?: number;
}

export const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({ data, height = 400 }) => {
  const chartData = data.map((item) => ({
    name: item.wbsCode || item.categoryName,
    budget: item.budgetAmount,
    actual: item.actualAmount,
    committed: item.committedAmount,
    remaining: item.remainingBudget,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          stroke="#6B7280"
          style={{ fontSize: '11px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
        />
        <Tooltip
          formatter={(value: any) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="budget" name="Budget" fill={COLORS.primary} />
        <Bar dataKey="actual" name="Actual" fill={COLORS.danger} />
        <Bar dataKey="committed" name="Committed" fill={COLORS.warning} />
      </BarChart>
    </ResponsiveContainer>
  );
};

interface CostBreakdownPieChartProps {
  data: CostBreakdown[];
  height?: number;
}

export const CostBreakdownPieChart: React.FC<CostBreakdownPieChartProps> = ({
  data,
  height = 350,
}) => {
  const chartData = data.map((item, index) => ({
    name: item.moduleName,
    value: item.totalCost,
    percentage: item.percentage,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const renderCustomLabel = (entry: any) => {
    return `${entry.name}: ${entry.percentage.toFixed(1)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

interface CostBreakdownBarChartProps {
  data: CostBreakdown[];
  height?: number;
}

export const CostBreakdownBarChart: React.FC<CostBreakdownBarChartProps> = ({
  data,
  height = 400,
}) => {
  const chartData = data
    .map((item) => ({
      name: item.moduleName,
      cost: item.totalCost,
      percentage: item.percentage,
    }))
    .sort((a, b) => b.cost - a.cost);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="horizontal"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          type="number"
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          width={150}
        />
        <Tooltip
          formatter={(value: any) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="cost" name="Total Cost" fill={COLORS.primary}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

interface CashFlowChartProps {
  data: CashFlowProjection[];
  height?: number;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, height = 400 }) => {
  const chartData = data.map((item) => ({
    month: item.month,
    inflow: item.actualInflow || item.plannedInflow,
    outflow: -(item.actualOutflow || item.forecastedOutflow), // Negative for visualization
    net: item.netCashFlow,
    cumulative: item.cumulativeCashFlow,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
        />
        <Tooltip content={<CashFlowTooltip />} />
        <Legend />
        <Bar dataKey="inflow" name="Cash Inflow" fill={COLORS.success} stackId="a" />
        <Bar dataKey="outflow" name="Cash Outflow" fill={COLORS.danger} stackId="a" />
        <Line
          type="monotone"
          dataKey="cumulative"
          name="Cumulative Cash Flow"
          stroke={COLORS.primary}
          strokeWidth={3}
          dot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

interface VarianceChartProps {
  data: BudgetVsActual[];
  height?: number;
}

export const VarianceChart: React.FC<VarianceChartProps> = ({ data, height = 400 }) => {
  const chartData = data
    .map((item) => ({
      name: item.wbsCode || item.categoryName,
      variance: item.variance,
      variancePercent: item.variancePercent,
    }))
    .sort((a, b) => a.variance - b.variance);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          stroke="#6B7280"
          style={{ fontSize: '11px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
        />
        <Tooltip
          formatter={(value: any) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="variance" name="Cost Variance">
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.variance >= 0 ? COLORS.success : COLORS.danger}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

interface TrendComparisonChartProps {
  data: TrendData[];
  metric: 'cost' | 'schedule';
  height?: number;
}

export const TrendComparisonChart: React.FC<TrendComparisonChartProps> = ({
  data,
  metric,
  height = 300,
}) => {
  const isCost = metric === 'cost';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id={`color${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isCost ? COLORS.primary : COLORS.secondary}
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor={isCost ? COLORS.primary : COLORS.secondary}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} domain={[0, 2]} />
        <Tooltip content={<PerformanceTooltip />} />
        <Area
          type="monotone"
          dataKey={isCost ? 'cpi' : 'spi'}
          name={isCost ? 'Cost Performance Index (CPI)' : 'Schedule Performance Index (SPI)'}
          stroke={isCost ? COLORS.primary : COLORS.secondary}
          fillOpacity={1}
          fill={`url(#color${metric})`}
        />
        {/* Reference line at 1.0 */}
        <Line
          type="monotone"
          dataKey={() => 1}
          name="Target (1.0)"
          stroke={COLORS.gray}
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  color = COLORS.primary,
  height = 50,
}) => {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="sparkline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill="url(#sparkline)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  height?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max = 100,
  label,
  height = 200,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const color =
    percentage >= 80 ? COLORS.success : percentage >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90" width="128" height="128">
          {/* Background circle */}
          <circle cx="64" cy="64" r="56" stroke="#E5E7EB" strokeWidth="12" fill="none" />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {value.toFixed(0)}
          </span>
        </div>
      </div>
      {label && <p className="mt-3 text-sm text-gray-600 font-medium">{label}</p>}
    </div>
  );
};

// Export all components
export default {
  EVMChart,
  PerformanceIndexChart,
  BudgetVsActualChart,
  CostBreakdownPieChart,
  CostBreakdownBarChart,
  CashFlowChart,
  VarianceChart,
  TrendComparisonChart,
  MiniSparkline,
  GaugeChart,
};
