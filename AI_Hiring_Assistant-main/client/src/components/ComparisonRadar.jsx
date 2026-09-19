import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Validated for a #1a1a19 surface: all three clear the CVD and normal-vision
// separation floors and 3:1 contrast, which is why the selection is capped at
// three candidates rather than cycling a fourth hue.
export const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70'];

const AXIS_INK = '#c3c2b7';
const GRID_INK = '#2c2c2a';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-line bg-raised px-3 py-2 shadow-lift">
      <p className="text-[12px] font-semibold text-ink">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-[12px] text-ink-2">
            <span className="h-2 w-2 rounded-sm" style={{ background: entry.color }} />
            {entry.name}
            <span className="ml-auto font-semibold text-ink numeric">{entry.value ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Radar axis labels sit outside the plot and have no room to wrap, so long
// competency names are clipped to keep the polygon centred.
const shorten = (name) => (name.length > 17 ? `${name.slice(0, 15)}…` : name);

export default function ComparisonRadar({ dimensions, candidates }) {
  const data = dimensions.map((dimension) => {
    const point = { dimension: shorten(dimension.name) };
    for (const candidate of candidates) {
      point[candidate.name] = candidate.scores[dimension.id] ?? null;
    }
    return point;
  });

  return (
    <div className="h-[340px] w-full px-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke={GRID_INK} />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: AXIS_INK, fontSize: 11 }} />
          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            tick={{ fill: '#898781', fontSize: 10 }}
            axisLine={false}
            stroke={GRID_INK}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="square"
            iconSize={9}
            wrapperStyle={{ fontSize: 12, color: AXIS_INK, paddingTop: 8 }}
          />
          {candidates.map((candidate, index) => (
            <Radar
              key={candidate.id}
              name={candidate.name}
              dataKey={candidate.name}
              stroke={SERIES_COLORS[index]}
              strokeWidth={2}
              fill={SERIES_COLORS[index]}
              fillOpacity={0.1}
              dot={{ r: 4, strokeWidth: 2, stroke: '#1a1a19', fill: SERIES_COLORS[index] }}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
