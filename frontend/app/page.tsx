'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CartesianGrid,
  Legend,
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
  downloads: string;
  paidSales: string;
};

type Summary = {
  from: string | null;
  to: string | null;
  source: string | null;
  revenueTotals: RevenueTotal[];
  downloads: number;
  paidSales: number;
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
  downloads: number;
  paidSales: number;
  revenue: DailyRevenue[];
};

type DailyResponse = {
  from: string | null;
  to: string | null;
  source: string | null;
  days: DailyRow[];
};

type AppDailyResponse = {
  app: {
    id: number;
    name: string;
    bundleId: string;
  };
  from: string | null;
  to: string | null;
  source: string | null;
  days: DailyRow[];
};

type DatePreset =
  | '7d'
  | '30d'
  | 'month'
  | 'all'
  | 'custom';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3000';

function formatDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getPresetDates(
  preset: DatePreset,
) {
  const today = new Date();

  if (preset === 'all') {
    return {
      from: '',
      to: '',
    };
  }

  if (preset === '7d') {
    const from = new Date(today);
    from.setDate(
      today.getDate() - 6,
    );

    return {
      from: formatDate(from),
      to: formatDate(today),
    };
  }

  if (preset === '30d') {
    const from = new Date(today);
    from.setDate(
      today.getDate() - 29,
    );

    return {
      from: formatDate(from),
      to: formatDate(today),
    };
  }

  if (preset === 'month') {
    const from = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    return {
      from: formatDate(from),
      to: formatDate(today),
    };
  }

  return {
    from: '',
    to: '',
  };
}

function buildQuery(
  from: string,
  to: string,
) {
  const params =
    new URLSearchParams();

  params.set(
    'source',
    'APPLE',
  );

  if (from) {
    params.set(
      'from',
      from,
    );
  }

  if (to) {
    params.set(
      'to',
      to,
    );
  }

  return params.toString();
}

export default function Home() {
  const [summary, setSummary] =
    useState<Summary | null>(null);

  const [daily, setDaily] =
    useState<DailyResponse | null>(null);

  const [
    selectedAppId,
    setSelectedAppId,
  ] =
    useState<number | null>(null);

  const [
    selectedAppDaily,
    setSelectedAppDaily,
  ] =
    useState<AppDailyResponse | null>(
      null,
    );

  const [
    preset,
    setPreset,
  ] =
    useState<DatePreset>('all');

  const [
    from,
    setFrom,
  ] =
    useState('');

  const [
    to,
    setTo,
  ] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadDashboard(
    nextFrom = from,
    nextTo = to,
    nextAppId = selectedAppId,
  ) {
    try {
      setLoading(true);
      setError(null);

      const query =
        buildQuery(
          nextFrom,
          nextTo,
        );

      const requests: Promise<Response>[] = [
        fetch(
          `${API_BASE_URL}/dashboard/summary?${query}`,
        ),

        fetch(
          `${API_BASE_URL}/dashboard/daily?${query}`,
        ),
      ];

      if (nextAppId !== null) {
        requests.push(
          fetch(
            `${API_BASE_URL}/dashboard/app/${nextAppId}/daily?${query}`,
          ),
        );
      }

      const responses =
        await Promise.all(
          requests,
        );

      const summaryResponse =
        responses[0];

      const dailyResponse =
        responses[1];

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

      if (
        nextAppId !== null &&
        responses[2]
      ) {
        if (!responses[2].ok) {
          throw new Error(
            `App API error ${responses[2].status}`,
          );
        }

        const appData =
          (await responses[2].json()) as AppDailyResponse;

        setSelectedAppDaily(
          appData,
        );
      } else {
        setSelectedAppDaily(
          null,
        );
      }
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

  useEffect(() => {
    loadDashboard(
      '',
      '',
      null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(
    nextPreset: DatePreset,
  ) {
    setPreset(nextPreset);

    if (
      nextPreset === 'custom'
    ) {
      return;
    }

    const dates =
      getPresetDates(
        nextPreset,
      );

    setFrom(dates.from);
    setTo(dates.to);

    loadDashboard(
      dates.from,
      dates.to,
      selectedAppId,
    );
  }

  function applyCustomRange() {
    setPreset('custom');

    loadDashboard(
      from,
      to,
      selectedAppId,
    );
  }

  function selectApp(
    appId: number | null,
  ) {
    setSelectedAppId(
      appId,
    );

    loadDashboard(
      from,
      to,
      appId,
    );
  }

  const activeDays =
    selectedAppDaily?.days ??
    daily?.days ??
    [];

  const chartData = useMemo(() => {
    return activeDays.map(
      (day) => ({
        date: day.date,
        downloads:
          day.downloads,
        paidSales:
          day.paidSales,
      }),
    );
  }, [activeDays]);

  const selectedApp =
    selectedAppId === null
      ? null
      : summary?.unitsByApp.find(
          (app) =>
            app.appId ===
            selectedAppId,
        ) ?? null;

  if (
    loading &&
    !summary
  ) {
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
          Failed to load dashboard:{' '}
          {error}
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

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Revenuers
            </h1>

            <p className="mt-2 text-sm text-neutral-400">
              Revenue and app performance dashboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {[
              ['7d', '7D'],
              ['30d', '30D'],
              [
                'month',
                'This Month',
              ],
              ['all', 'All'],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    applyPreset(
                      value as DatePreset,
                    )
                  }
                  className={`rounded-xl border px-4 py-2 text-sm transition ${
                    preset === value
                      ? 'border-neutral-500 bg-neutral-800 text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ),
            )}

            <div className="ml-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300">
              Apple
            </div>

          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">

          <div className="flex flex-col gap-4 md:flex-row md:items-end">

            <div>
              <label className="mb-2 block text-xs text-neutral-500">
                From
              </label>

              <input
                type="date"
                value={from}
                onChange={(event) => {
                  setPreset(
                    'custom',
                  );

                  setFrom(
                    event.target.value,
                  );
                }}
                className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-neutral-500">
                To
              </label>

              <input
                type="date"
                value={to}
                onChange={(event) => {
                  setPreset(
                    'custom',
                  );

                  setTo(
                    event.target.value,
                  );
                }}
                className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-white"
              />
            </div>

            <button
              onClick={
                applyCustomRange
              }
              className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Apply
            </button>

            <div className="md:ml-auto">

              <label className="mb-2 block text-xs text-neutral-500">
                App
              </label>

              <select
                value={
                  selectedAppId ??
                  ''
                }
                onChange={(
                  event,
                ) => {
                  const value =
                    event.target
                      .value;

                  selectApp(
                    value
                      ? Number(
                          value,
                        )
                      : null,
                  );
                }}
                className="min-w-64 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-white"
              >
                <option value="">
                  All Apps
                </option>

                {summary.unitsByApp.map(
                  (app) => (
                    <option
                      key={
                        app.appId
                      }
                      value={
                        app.appId
                      }
                    >
                      {
                        app.appName
                      }
                    </option>
                  ),
                )}
              </select>

            </div>

          </div>

        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="text-sm text-neutral-400">
              Downloads
            </div>

            <div className="mt-3 text-4xl font-semibold">
              {selectedApp
                ? selectedApp.downloads
                : summary.downloads}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="text-sm text-neutral-400">
              Paid Sales
            </div>

            <div className="mt-3 text-4xl font-semibold">
              {selectedApp
                ? selectedApp.paidSales
                : summary.paidSales}
            </div>
          </div>

          {summary.revenueTotals.map(
            (revenue) => (
              <div
                key={
                  revenue.currency
                }
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
                  {
                    revenue.currency
                  }
                </div>

                <div className="mt-4 text-xs text-neutral-500">
                  Gross:{' '}
                  {Number(
                    revenue.grossAmount,
                  ).toFixed(2)}{' '}
                  {
                    revenue.currency
                  }
                </div>
              </div>
            ),
          )}

        </section>

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-medium">
                {selectedAppDaily
                  ? selectedAppDaily
                      .app.name
                  : 'Daily Activity'}
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Downloads and paid sales by day
              </p>
            </div>

            {selectedAppId !==
              null && (
              <button
                onClick={() =>
                  selectApp(
                    null,
                  )
                }
                className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Show all apps
              </button>
            )}

          </div>

          <div className="h-80 w-full">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
              >

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
                  allowDecimals={
                    false
                  }
                />

                <Tooltip
                  contentStyle={{
                    background:
                      '#171717',
                    border:
                      '1px solid #404040',
                    borderRadius:
                      '12px',
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="downloads"
                  name="Downloads"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="paidSales"
                  name="Paid Sales"
                  stroke="#a3a3a3"
                  strokeWidth={2}
                  dot
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
              (app) => {
                const selected =
                  selectedAppId ===
                  app.appId;

                return (
                  <button
                    key={
                      app.appId
                    }
                    onClick={() =>
                      selectApp(
                        app.appId,
                      )
                    }
                    className={`flex w-full items-center justify-between gap-8 p-6 text-left transition ${
                      selected
                        ? 'bg-neutral-800/70'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >

                    <div>
                      <div className="font-medium">
                        {
                          app.appName
                        }
                      </div>

                      <div className="mt-1 text-sm text-neutral-500">
                        App ID{' '}
                        {
                          app.appId
                        }
                      </div>
                    </div>

                    <div className="flex gap-10 text-right">

                      <div>
                        <div className="text-sm text-neutral-400">
                          Downloads
                        </div>

                        <div className="mt-1 text-xl font-semibold">
                          {
                            app.downloads
                          }
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-neutral-400">
                          Paid Sales
                        </div>

                        <div className="mt-1 text-xl font-semibold">
                          {
                            app.paidSales
                          }
                        </div>
                      </div>

                    </div>

                  </button>
                );
              },
            )}

          </div>

        </section>

      </div>
    </main>
  );
}