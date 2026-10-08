"use client";

import { useEffect, useRef } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";
import {
  formatAxisValue,
  getMonthShortLabel,
  type MonthlyRevenue,
} from "@/admin/laporan/report-range";
import { formatRupiah } from "@/admin/pembayaran/payment-format";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
);

/** Biru terang untuk bulan biasa, navy pekat untuk bulan yang disorot. */
const BAR_BASE = "#7FB3E8";
const BAR_HIGHLIGHT = "#0A3966";
const BAR_NAVY_DEEP = "#0A2540";
const GRID_COLOR = "#E4EEF7";
const TICK_COLOR = "#7F94A8";

type RevenueChartProps = {
  data: MonthlyRevenue[];
  /** Kunci bulan yang memakai warna navy, mis. bulan ini. */
  highlightKey: string | null;
  /** Kunci bulan dengan pendapatan tertinggi, dipakai sebagai cadangan. */
  topKey: string | null;
};

type BarTone = "base" | "highlight" | "top" | "context";

/**
 * Grafik batang pendapatan bulanan.
 *
 * Values supplied by the page and calculated from the database; this component
 * only makes sure Chart.js rebuilds the chart whenever the data, the highlight
 * month, or the canvas size changes.
 */
export default function RevenueChart({
  data,
  highlightKey,
  topKey,
}: RevenueChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chartRef.current?.destroy();
    chartRef.current = null;

    const tones: BarTone[] = data.map((item) => {
      if (item.key === highlightKey) return "highlight";
      if (item.key === topKey) return "top";
      return item.total > 0 ? "base" : "context";
    });

    chartRef.current = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.map((item) => getMonthShortLabel(item.month)),
        datasets: [
          {
            label: "Pendapatan",
            data: data.map((item) => item.total),
            backgroundColor: tones.map((tone) => {
              if (tone === "highlight") return BAR_NAVY_DEEP;
              if (tone === "top") return BAR_HIGHLIGHT;
              if (tone === "context") return GRID_COLOR;
              return BAR_BASE;
            }),
            hoverBackgroundColor: BAR_NAVY_DEEP,
            borderRadius: 6,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        layout: { padding: { top: 4 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0A2540",
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (tooltipItem) => {
                const item = data[tooltipItem.dataIndex];
                const lines = [formatRupiah(item.total)];
                if (item.paidCount > 0) {
                  lines.push(`${item.paidCount} transaksi lunas`);
                }
                return lines;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: TICK_COLOR, font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: GRID_COLOR, drawTicks: false },
            border: { display: false },
            ticks: {
              color: TICK_COLOR,
              font: { size: 10 },
              padding: 8,
              maxTicksLimit: 6,
              callback: (value) => formatAxisValue(Number(value)),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, highlightKey, topKey]);

  return (
    <div className="h-[260px] w-full">
      <canvas ref={canvasRef} role="img" aria-label="Grafik pendapatan per bulan" />
    </div>
  );
}