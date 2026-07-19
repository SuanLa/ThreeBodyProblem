import {useEffect, useRef, useState} from "react";
import {Card, Typography} from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from '@mui/icons-material/Close';
import {formatValue} from "../physics/conserved";

// 深色图表配色（dataviz 参考调色板暗色系列，已通过验证脚本）
const INK = {
    surface: "rgba(26, 26, 25, 0.94)",
    primary: "#ffffff",
    secondary: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    baseline: "#383835",
};

// 面板中的三张图：能量 / 动量与角动量 / 天体间距，
// 系列颜色按调色板固定槽位顺序分配，不随图重置
const CHARTS = [
    {
        id: "energy",
        title: "总能量 E",
        series: [{key: "energy", label: "E", color: "#3987e5"}],
    },
    {
        id: "momentum",
        title: "动量与角动量",
        series: [
            {key: "momentum", label: "|p|", color: "#008300"},
            {key: "angMomentum", label: "|L|", color: "#d55181"},
        ],
    },
    {
        id: "distance",
        title: "天体间距",
        series: [
            {key: "d12", label: "d₁₂", color: "#c98500"},
            {key: "d13", label: "d₁₃", color: "#199e70"},
            {key: "d23", label: "d₂₃", color: "#d95926"},
        ],
    },
    {
        id: "separation",
        title: "轨迹分离 δ（对数刻度）",
        log: true,
        series: [{key: "separation", label: "δ", color: "#9085e9"}],
    },
];

// 每张图最多绘制的采样点数（约 1x 速度下最近 15 秒）
const WINDOW_POINTS = 1500;

const CANVAS_HEIGHT = 72;
const PAD = {left: 6, right: 6, top: 6, bottom: 6};

function chartWindow(samples) {
    const start = Math.max(0, samples.length - WINDOW_POINTS);
    return samples.slice(start);
}

// 绘制一张迷你折线图；hoverIndex 为窗口内下标，-1 表示无悬浮。
// chart.log 为真时纵轴取 log10，用于指数增长的量（轨迹分离）
function drawChart(canvas, samples, chart, hoverIndex) {
    const series = chart.series;
    const valueOf = chart.log
        ? (v) => Math.log10(Math.max(v, 1e-16))
        : (v) => v;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = CANVAS_HEIGHT;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const win = chartWindow(samples);
    if (win.length < 2) {
        return;
    }

    // 所有系列共用一个纵轴。近守恒的曲线不做满幅放大：
    // 量程下限取值域幅度的 5%，防止把机器精度噪声画成剧烈波动
    let min = Infinity, max = -Infinity;
    for (const s of win) {
        for (const {key} of series) {
            if (s[key] === null || s[key] === undefined) continue;
            const v = valueOf(s[key]);
            if (v < min) min = v;
            if (v > max) max = v;
        }
    }
    if (min === Infinity) {
        return;
    }
    const magnitude = Math.max(Math.abs(min), Math.abs(max), 1e-12);
    const range = Math.max(max - min, magnitude * 0.05);
    const mid = (max + min) / 2;
    const yMin = mid - range * 0.55;
    const yMax = mid + range * 0.55;

    const plotW = cssW - PAD.left - PAD.right;
    const plotH = cssH - PAD.top - PAD.bottom;
    const xAt = (i) => PAD.left + (i / (win.length - 1)) * plotW;
    const yAt = (v) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

    // 网格与基线（细线、退居背景）
    ctx.lineWidth = 1;
    ctx.strokeStyle = INK.grid;
    for (const frac of [0.25, 0.5, 0.75]) {
        const y = PAD.top + plotH * frac;
        ctx.beginPath();
        ctx.moveTo(PAD.left, y);
        ctx.lineTo(cssW - PAD.right, y);
        ctx.stroke();
    }
    ctx.strokeStyle = INK.baseline;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(cssW - PAD.right, PAD.top + plotH);
    ctx.stroke();

    // 悬浮十字线
    if (hoverIndex >= 0 && hoverIndex < win.length) {
        ctx.strokeStyle = INK.baseline;
        ctx.beginPath();
        ctx.moveTo(xAt(hoverIndex), PAD.top);
        ctx.lineTo(xAt(hoverIndex), PAD.top + plotH);
        ctx.stroke();
    }

    // 数据线：2px 圆角连接
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const {key, color} of series) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < win.length; i++) {
            if (win[i][key] === null || win[i][key] === undefined) continue;
            const x = xAt(i);
            const y = yAt(valueOf(win[i][key]));
            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        if (hoverIndex >= 0 && hoverIndex < win.length && win[hoverIndex][key] !== null && win[hoverIndex][key] !== undefined) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(xAt(hoverIndex), yAt(valueOf(win[hoverIndex][key])), 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function LegendRow({series, sample}) {
    return (
        <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap'}}>
            {series.map(({key, label, color}) => (
                <Box key={key} sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    <Box sx={{width: 8, height: 8, borderRadius: '2px', bgcolor: color, flexShrink: 0}}/>
                    <Typography variant="caption" sx={{color: INK.secondary}}>
                        {label}
                    </Typography>
                    <Typography variant="caption" sx={{color: INK.primary, fontVariantNumeric: 'tabular-nums'}}>
                        {sample ? formatValue(sample[key]) : "—"}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

export default function ConservedPanel({metricsRef, onClose}) {
    const canvasRefs = useRef({});
    // hover: {chartId, index}（窗口内下标），null 表示无悬浮
    const [hover, setHover] = useState(null);
    // 周期性自增触发图例刷新，画布在渲染后的 effect 里重绘
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick((t) => t + 1), 250);
        return () => clearInterval(timer);
    }, []);

    const samples = metricsRef.current;
    const win = chartWindow(samples);
    const latest = samples.length > 0 ? samples[samples.length - 1] : null;

    // 分离距离图只在混沌对比数据存在时出现
    const activeCharts = CHARTS.filter(
        (c) => c.id !== "separation" || (latest !== null && latest.separation !== null && latest.separation !== undefined)
    );

    useEffect(() => {
        for (const chart of activeCharts) {
            const canvas = canvasRefs.current[chart.id];
            if (canvas) {
                const idx = hover !== null && hover.chartId === chart.id ? hover.index : -1;
                drawChart(canvas, metricsRef.current, chart, idx);
            }
        }
    });

    // 图例显示悬浮点数值，未悬浮时显示最新值
    const sampleFor = (chartId) => {
        if (hover !== null && hover.chartId === chartId && win[hover.index]) {
            return win[hover.index];
        }
        return latest;
    };

    const handleMove = (chartId) => (event) => {
        if (win.length < 2) {
            return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const frac = (event.clientX - rect.left - PAD.left) / Math.max(rect.width - PAD.left - PAD.right, 1);
        const index = Math.round(Math.min(Math.max(frac, 0), 1) * (win.length - 1));
        setHover({chartId, index});
    };

    // 相对能量漂移 ΔE/E₀：积分误差的核心观测指标
    const e0 = samples.length > 0 ? samples[0].energy : null;
    const drift = latest !== null && e0 !== null && e0 !== 0
        ? Math.abs(latest.energy - e0) / Math.abs(e0)
        : null;

    const hoverT = hover !== null && win[hover.index] ? win[hover.index].t : null;

    return (
        <Card className={"metrics-panel"} sx={{bgcolor: INK.surface, color: INK.primary, p: 1.5, backdropFilter: 'blur(4px)'}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5}}>
                <Typography variant="subtitle2" sx={{color: INK.primary}}>守恒量监测</Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography variant="caption" sx={{color: INK.muted, fontVariantNumeric: 'tabular-nums'}}>
                        t = {latest === null ? "—" : formatValue(hoverT ?? latest.t)}
                    </Typography>
                    <IconButton size="small" aria-label="关闭面板" onClick={onClose} sx={{color: INK.muted}}>
                        <CloseIcon fontSize="inherit"/>
                    </IconButton>
                </Box>
            </Box>

            {samples.length < 2 ? (
                <Typography variant="body2" sx={{color: INK.muted, py: 2, textAlign: 'center'}} role="status">
                    点击播放后开始记录守恒量数据
                </Typography>
            ) : (
                activeCharts.map((chart) => (
                    <Box key={chart.id} sx={{mb: 1}}>
                        <Box sx={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
                            <Typography variant="caption" sx={{color: INK.secondary}}>{chart.title}</Typography>
                            {chart.id === "energy" && drift !== null && (
                                <Typography variant="caption" sx={{color: INK.muted, fontVariantNumeric: 'tabular-nums'}}>
                                    ΔE/E₀ = {drift.toExponential(1)}
                                </Typography>
                            )}
                        </Box>
                        <LegendRow series={chart.series} sample={sampleFor(chart.id)}/>
                        <canvas
                            ref={(el) => { canvasRefs.current[chart.id] = el; }}
                            style={{width: '100%', height: CANVAS_HEIGHT, display: 'block', cursor: 'crosshair'}}
                            onMouseMove={handleMove(chart.id)}
                            onMouseLeave={() => setHover(null)}
                            aria-label={chart.title}
                        />
                    </Box>
                ))
            )}
        </Card>
    );
}
