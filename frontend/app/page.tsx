'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type RevenueTotal = {
  currency: string;
  grossAmount: string;
  netAmount: string;
};

type UnitsByApp = {
  appId: number;
  appName: string;
  units: string;
};

type Summary = {
  from: string | null;
  to: string | null;
  source: string | null;
  revenueTotals: RevenueTotal[];
  totalUnits: number;
  revenueBySource: unknown[];
  revenueByType: unknown[];
  revenueByApp: unknown[];
  unitsByApp: UnitsByApp[];
};

type DailyRevenue = {
  currency: string;
  grossAmount: string;
  netAmount: string;
};

type DailyRow = {
  date: string;
  units: number;
  revenue: DailyRevenue[];
};

type DailyResponse = {
  from: string | null;
  to: string | null;
  source: string | null;
  days: DailyRow[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3000';

export default function Home() {
  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [daily, setDaily] =
    useState<DailyResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [
          summaryResponse,
          dailyResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/dashboard/summary?source=APPLE`,
          ),
          fetch(
            `${API_BASE_URL}/dashboard/daily?source=APPLE`,
          ),
        ]);

        if (!summaryResponse.ok) {
          throw new Error(
            `Summary API error ${summaryResponse.status}`,
          );
        }

        if (!dailyResponse.ok) {
          throw new Error(
            `Daily API error ${dailyResponse.status}`,
          );
        }

        const summaryData =
          (await summaryResponse.json()) as Summary;

        const dailyData =
          (await dailyResponse.json()) as DailyResponse;

        setSummary(summaryData);
        setDaily(dailyData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : String(err),
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const chartData = useMemo(() => {
    if (!daily) {
      return [];
    }

    return daily.days.map((day) => ({
      date: day.date,
      units: day.units,
    }));
  }, [daily]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 p-8 text-white">
        Loading dashboard...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-950 p-8 text-white">
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6">
          Failed to load dashboard: {error}
        </div>
      </main>
    );
  }

  if (!summary || !daily) {
    return null;
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Revenuers
            </h1>

            <p className="mt-2 text-sm text-neutral-400">
              Revenue and app performance dashboard
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300">
            Apple
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="text-sm text-neutral-400">
              Total Units
            </div>

            <div className="mt-3 text-4xl font-semibold">
              {summary.totalUnits}
            </div>
          </div>

          {summary.revenueTotals.map(
            (revenue) => (
              <div
                key={revenue.currency}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="text-sm text-neutral-400">
                  Net Revenue
                </div>

                <div className="mt-3 text-4xl font-semibold">
                  {Number(
                    revenue.netAmount,
                  ).toFixed(2)}
                </div>

                <div className="mt-1 text-sm text-neutral-400">
                  {revenue.currency}
                </div>

                <div className="mt-4 text-xs text-neutral-500">
                  Gross:{' '}
                  {Number(
                    revenue.grossAmount,
                  ).toFixed(2)}{' '}
                  {revenue.currency}
                </div>
              </div>
            ),
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium">
              Daily Units
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Imported Apple activity by day
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#262626"
                />

                <XAxis
                  dataKey="date"
                  stroke="#737373"
                  fontSize={12}
                />

                <YAxis
                  stroke="#737373"
                  fontSize={12}
                />

                <Tooltip
                  contentStyle={{
                    background: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '12px',
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="units"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 p-6">
            <h2 className="text-lg font-medium">
              Apps
            </h2>
          </div>

          <div className="divide-y divide-neutral-800">
            {summary.unitsByApp.map(
              (app) => (
                <div
                  key={app.appId}
                  className="flex items-center justify-between p-6"
                >
                  <div>
                    <div className="font-medium">
                      {app.appName}
                    </div>

                    <div className="mt-1 text-sm text-neutral-500">
                      App ID {app.appId}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-semibold">
                      {app.units}
                    </div>

                    <div className="text-sm text-neutral-500">
                      units
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </main>
  );
}