"use client"

interface FunnelData {
  stage: string
  value: number
  color: string
}

interface FunnelChartProps {
  data: FunnelData[]
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const width = (item.value / maxValue) * 100
        const conversionRate = index > 0 ? ((item.value / data[index - 1].value) * 100).toFixed(1) : "100.0"

        return (
          <div key={item.stage} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{item.stage}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{item.value}</span>
                {index > 0 && <span className="text-xs text-gray-500">({conversionRate}%)</span>}
              </div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    backgroundColor: item.color,
                  }}
                >
                  {width > 20 && item.value}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
