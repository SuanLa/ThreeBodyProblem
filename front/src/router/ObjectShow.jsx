import {Canvas} from "@react-three/fiber";
import {Stars} from "@react-three/drei";
import Object from "../component/Object";
import {Card, MenuItem, Select, Slider, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import {Navigate} from "react-router-dom";
import {connect} from "../http/websocket";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EjectIcon from '@mui/icons-material/Eject';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import Controls from "../component/Control";
import ConservedPanel from "../component/ConservedPanel";
import {computeMetrics, computeSeparation} from "../physics/conserved";
import {downloadJSON, readJSONFile, isRecording} from "../store/schemes";
import "../css/Object.css";

const WS_URL = "ws://localhost:6750/v1/track";

// 三个天体各自的尾迹颜色，便于区分轨道
const TRAIL_COLORS = ["#ffb36b", "#7ec8ff", "#ff8383"];

// 倍速映射：加速档在每帧内多走几步，减速档拉长推送间隔
const SPEED_OPTIONS = [
    {label: "0.25x", value: 0.25, sleepTime: 4, stepsPerPush: 1},
    {label: "0.5x", value: 0.5, sleepTime: 2, stepsPerPush: 1},
    {label: "1x", value: 1, sleepTime: 1, stepsPerPush: 1},
    {label: "2x", value: 2, sleepTime: 1, stepsPerPush: 2},
    {label: "4x", value: 4, sleepTime: 1, stepsPerPush: 4},
];

// 时间轴最多保留的帧数（1x 速度约 30 秒），超出后成块丢弃最旧的帧
const TIMELINE_MAX_FRAMES = 3000;
const TIMELINE_DROP_CHUNK = 500;

// 混沌对比模式给天体 0 的 X 坐标加的初值扰动
const PERTURBATION = 1e-6;

export default function Show(){

    // 初始协议数据来自设置页写入的 sessionStorage
    const [protocol] = useState(() => {
        const item = sessionStorage.getItem("protocol");
        return item === null ? null : JSON.parse(item);
    });

    // 服务端推送的最新数据写入 ref，由渲染循环每帧读取，
    // 避免高频 setState 导致整棵组件树重渲染
    const latestObjectsRef = useRef(protocol === null ? [] : protocol.Objects.objects);
    const webSocketRef = useRef(null);
    // 时间轴帧缓冲，同样只存 ref：仿真运行期间不触发任何重渲染
    const timelineRef = useRef([]);
    // 守恒量采样缓冲
    const metricsRef = useRef([]);
    // messageHandler 里需要读到最新的播放状态，state 会被闭包固定，所以镜像一份
    const playStateRef = useRef("idle");
    // 回放引擎状态：录像帧、播放头、速度累加器与定时器
    const replayRef = useRef({frames: [], twin: [], idx: 0, acc: 0, timer: null});
    // 混沌对比：孪生系统的最新状态与时间轴（与主时间轴下标对齐，无孪生时为 null）
    const latestTwinRef = useRef(null);
    const twinTimelineRef = useRef([]);
    const modeRef = useRef("live");
    const speedRef = useRef(1);
    const fileInputRef = useRef(null);

    const [playState, setPlayState] = useState("idle"); // idle | running | paused
    const [speed, setSpeed] = useState(1);
    const [showMetrics, setShowMetrics] = useState(false);
    // 积分器：预设默认 verlet，可实时切换观察能量漂移差异
    const [integrator, setIntegrator] = useState(() => (protocol && protocol.Method) || "verlet");
    // live = 实时仿真；replay = 离线回放导入的录像
    const [mode, setMode] = useState("live");
    // 混沌对比模式开关
    const [chaosMode, setChaosMode] = useState(false);
    // 当前回放录像是否携带孪生轨迹
    const [hasTwinReplay, setHasTwinReplay] = useState(false);
    // 回放录像携带的协议元数据（半径/相机/引力常数等）
    const [replayMeta, setReplayMeta] = useState(null);
    const [timelineLen, setTimelineLen] = useState(0);
    const [scrubIndex, setScrubIndex] = useState(0);
    // 重置时递增以重建天体组件，清空尾迹
    const [sceneEpoch, setSceneEpoch] = useState(0);

    // 组件卸载时断开连接并停掉回放定时器
    useEffect(() => {
        return () => {
            if (webSocketRef.current !== null) {
                webSocketRef.current.close();
            }
            if (replayRef.current.timer !== null) {
                clearInterval(replayRef.current.timer);
            }
        };
    }, []);

    // 尚未配置初始参数时回到设置页
    if (protocol === null) {
        return <Navigate to="/setting" replace/>;
    }

    // 回放模式下场景参数来自录像元数据
    const activeProto = replayMeta === null ? protocol : replayMeta;
    // 预设可携带天体显示半径与相机位置（归一化单位的轨道尺度远小于默认场景）
    const bodyRadius = activeProto.Radius || 1;
    const cameraPosition = activeProto.Camera || [6, 4, 10];
    // 守恒量计算所用引力常数，与后端默认值保持一致
    const gravity = activeProto.G || 6.67e-8;

    const setPlay = (st) => {
        playStateRef.current = st;
        setPlayState(st);
    };

    /* ---------- 回放引擎 ---------- */

    const stopReplayTimer = () => {
        if (replayRef.current.timer !== null) {
            clearInterval(replayRef.current.timer);
            replayRef.current.timer = null;
        }
    };

    // 每 tick 按倍速推进播放头；速度累加器让 0.25x/0.5x 也能平滑步进
    const replayTick = () => {
        const r = replayRef.current;
        r.acc += speedRef.current;
        while (r.acc >= 1 && r.idx < r.frames.length - 1) {
            r.idx++;
            r.acc--;
        }
        latestObjectsRef.current = r.frames[r.idx];
        latestTwinRef.current = r.twin[r.idx] || null;

        if (r.idx >= r.frames.length - 1) {
            // 播完自动停在最后一帧
            stopReplayTimer();
            setTimelineLen(r.frames.length);
            setScrubIndex(r.frames.length - 1);
            setPlay("paused");
        }
    };

    const startReplayTimer = () => {
        stopReplayTimer();
        const base = (replayMeta && replayMeta.SleepTime) || 1;
        replayRef.current.timer = setInterval(replayTick, base * 10);
    };

    const enterReplay = (recording) => {
        if (webSocketRef.current !== null) {
            webSocketRef.current.close();
            webSocketRef.current = null;
        }
        stopReplayTimer();

        const frames = recording.frames;
        const twinFrames = Array.isArray(recording.twinFrames) ? recording.twinFrames : [];
        const g = (recording.protocol && recording.protocol.G) || 6.67e-8;
        replayRef.current = {frames, twin: twinFrames, idx: 0, acc: 0, timer: null};
        // 时间轴与守恒量面板直接复用整段录像
        timelineRef.current = frames;
        twinTimelineRef.current = twinFrames;
        metricsRef.current = frames.map((f, i) => {
            const m = computeMetrics(f, g);
            m.separation = twinFrames[i] ? computeSeparation(f, twinFrames[i]) : null;
            return m;
        });
        latestObjectsRef.current = frames[0];
        latestTwinRef.current = twinFrames[0] || null;
        setHasTwinReplay(twinFrames.some(Boolean));

        modeRef.current = "replay";
        setMode("replay");
        setReplayMeta(recording.protocol);
        setPlay("paused");
        setTimelineLen(frames.length);
        setScrubIndex(0);
        setSceneEpoch((e) => e + 1);
    };

    const exitReplay = () => {
        stopReplayTimer();
        replayRef.current = {frames: [], twin: [], idx: 0, acc: 0, timer: null};
        timelineRef.current = [];
        twinTimelineRef.current = [];
        metricsRef.current = [];
        latestObjectsRef.current = protocol.Objects.objects;
        latestTwinRef.current = null;
        setHasTwinReplay(false);

        modeRef.current = "live";
        setMode("live");
        setReplayMeta(null);
        setPlay("idle");
        setTimelineLen(0);
        setScrubIndex(0);
        setSceneEpoch((e) => e + 1);
    };

    const handleExportRecording = () => {
        const frames = timelineRef.current;
        if (frames.length < 2) {
            return;
        }
        const twinFrames = twinTimelineRef.current;
        downloadJSON(`threebody-recording-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.json`, {
            type: "threebody-recording",
            version: 1,
            protocol: {...protocol, Method: integrator},
            frames,
            ...(twinFrames.some(Boolean) ? {twinFrames} : {}),
        });
    };

    const handleImportRecording = async (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        try {
            const data = await readJSONFile(file);
            if (!isRecording(data)) {
                alert("不是有效的仿真录像文件");
                return;
            }
            enterReplay(data);
        } catch (err) {
            alert(err.message);
        }
    };

    // websocket回调函数
    function messageHandler(message){
        const parse = JSON.parse(message);
        latestObjectsRef.current = parse.Objects.objects;

        const tl = timelineRef.current;
        tl.push(parse.Objects.objects);
        if (tl.length > TIMELINE_MAX_FRAMES) {
            tl.splice(0, TIMELINE_DROP_CHUNK);
        }

        // 孪生系统数据与主时间轴下标对齐
        const twinArr = parse.TwinObjects ? parse.TwinObjects.objects : null;
        latestTwinRef.current = twinArr;
        twinTimelineRef.current.push(twinArr);
        if (twinTimelineRef.current.length > TIMELINE_MAX_FRAMES) {
            twinTimelineRef.current.splice(0, TIMELINE_DROP_CHUNK);
        }

        const metrics = metricsRef.current;
        const metric = computeMetrics(parse.Objects.objects, gravity);
        metric.separation = twinArr === null ? null : computeSeparation(parse.Objects.objects, twinArr);
        metrics.push(metric);
        if (metrics.length > TIMELINE_MAX_FRAMES) {
            metrics.splice(0, TIMELINE_DROP_CHUNK);
        }

        // 暂停态还会收到单步产生的帧，让时间轴跟着增长并停在最新帧
        if (playStateRef.current === "paused") {
            setTimelineLen(tl.length);
            setScrubIndex(tl.length - 1);
        }
    }

    const send = (obj) => webSocketRef.current.send(JSON.stringify(obj));

    const speedFields = (sp) => {
        const opt = SPEED_OPTIONS.find((o) => o.value === sp);
        return {SleepTime: opt.sleepTime, StepsPerPush: opt.stepsPerPush};
    };

    // 深拷贝并对天体 0 的 X 坐标加微扰，生成孪生系统初值
    const perturbObjects = (objects) => {
        const twin = JSON.parse(JSON.stringify(objects));
        twin[0].Position.X += PERTURBATION;
        return twin;
    };

    // 全量启动协议：携带预设参数与指定的物体状态；
    // twinObjects 非空时同时启动孪生系统（混沌对比）
    const startProtocol = (objects, twinObjects = null) => ({
        ...protocol,
        Timestamp: Math.floor(Date.now() / 1000),
        ...speedFields(speed),
        Method: integrator,
        Objects: {objects},
        ...(twinObjects !== null ? {TwinObjects: {objects: twinObjects}} : {}),
    });

    const handlePlay = () => {
        if (mode === "replay") {
            const r = replayRef.current;
            if (playState === "running") {
                stopReplayTimer();
                setTimelineLen(r.frames.length);
                setScrubIndex(r.idx);
                setPlay("paused");
            } else {
                // 从时间轴位置继续；已到末尾则从头再播
                r.idx = scrubIndex >= r.frames.length - 1 ? 0 : scrubIndex;
                r.acc = 0;
                startReplayTimer();
                setPlay("running");
            }
            return;
        }

        if (playState === "running") {
            send({star: true, Cmd: "pause"});
            setTimelineLen(timelineRef.current.length);
            setScrubIndex(Math.max(timelineRef.current.length - 1, 0));
            setPlay("paused");
            return;
        }

        if (playState === "paused" && webSocketRef.current !== null) {
            const tl = timelineRef.current;
            if (scrubIndex < tl.length - 1) {
                // 从时间轴中段继续：以该帧为新初值重启仿真，截断其后的历史
                const objects = tl[scrubIndex];
                const twin = chaosMode ? (twinTimelineRef.current[scrubIndex] || perturbObjects(objects)) : null;
                tl.length = scrubIndex + 1;
                twinTimelineRef.current.length = scrubIndex + 1;
                latestObjectsRef.current = objects;
                latestTwinRef.current = twin;
                // 守恒量历史同步截断到该时刻
                const tCut = objects[0].Time;
                metricsRef.current = metricsRef.current.filter((m) => m.t <= tCut + 1e-12);
                send(startProtocol(objects, twin));
            } else {
                send({star: true, Cmd: "resume"});
            }
            setPlay("running");
            return;
        }

        // idle：建立连接并启动（从当前展示的状态继续）
        const startTwin = chaosMode
            ? (latestTwinRef.current || perturbObjects(latestObjectsRef.current))
            : null;
        latestTwinRef.current = startTwin;
        webSocketRef.current = connect(
            WS_URL,
            JSON.stringify(startProtocol(latestObjectsRef.current, startTwin)),
            messageHandler,
            () => {
                webSocketRef.current = null;
                // 进入回放前主动断开也会触发 onclose，此时不能覆盖回放状态
                if (modeRef.current === "live") {
                    setPlay("idle");
                }
            }
        );
        setPlay("running");
    };

    const handleStep = () => {
        if (mode === "replay") {
            const r = replayRef.current;
            stopReplayTimer();
            const from = playState === "running" ? r.idx : scrubIndex;
            const next = Math.min(from + 1, r.frames.length - 1);
            r.idx = next;
            latestObjectsRef.current = r.frames[next];
            latestTwinRef.current = r.twin[next] || null;
            setTimelineLen(r.frames.length);
            setScrubIndex(next);
            setPlay("paused");
            return;
        }

        if (webSocketRef.current === null) {
            return;
        }
        send({star: true, Cmd: "step"});
        setPlay("paused");
    };

    const handleReset = () => {
        if (mode === "replay") {
            const r = replayRef.current;
            stopReplayTimer();
            r.idx = 0;
            r.acc = 0;
            latestObjectsRef.current = r.frames[0];
            latestTwinRef.current = r.twin[0] || null;
            setTimelineLen(r.frames.length);
            setScrubIndex(0);
            setSceneEpoch((e) => e + 1);
            setPlay("paused");
            return;
        }

        const initialObjects = protocol.Objects.objects;
        const twin = chaosMode ? perturbObjects(initialObjects) : null;
        latestObjectsRef.current = initialObjects;
        latestTwinRef.current = twin;
        timelineRef.current = [];
        twinTimelineRef.current = [];
        metricsRef.current = [];
        setTimelineLen(0);
        setScrubIndex(0);
        setSceneEpoch((e) => e + 1);

        if (webSocketRef.current !== null) {
            send(startProtocol(initialObjects, twin));
            setPlay("running");
        } else {
            setPlay("idle");
        }
    };

    const handleSpeed = (event, sp) => {
        if (sp === null) {
            return;
        }
        setSpeed(sp);
        speedRef.current = sp;
        if (webSocketRef.current !== null) {
            const opt = SPEED_OPTIONS.find((o) => o.value === sp);
            send({star: true, Cmd: "speed", SleepTime: opt.sleepTime, StepsPerPush: opt.stepsPerPush});
        }
    };

    const handleIntegrator = (event) => {
        const method = event.target.value;
        setIntegrator(method);
        if (webSocketRef.current !== null) {
            // 以当前状态为初值、用新积分器重建仿真，保持轨迹连续（孪生系统同样延续）
            const twin = chaosMode ? latestTwinRef.current : null;
            send({
                ...protocol,
                Timestamp: Math.floor(Date.now() / 1000),
                ...speedFields(speed),
                Method: method,
                Objects: {objects: latestObjectsRef.current},
                ...(twin !== null ? {TwinObjects: {objects: twin}} : {}),
            });
            if (playState === "paused") {
                // 全量更新会让服务端恢复运行，补一条暂停指令保持暂停态
                send({star: true, Cmd: "pause"});
            }
        }
    };

    const handleScrub = (event, idx) => {
        setScrubIndex(idx);
        const frame = timelineRef.current[idx];
        if (frame) {
            latestObjectsRef.current = frame;
        }
        latestTwinRef.current = twinTimelineRef.current[idx] || null;
        if (mode === "replay") {
            replayRef.current.idx = idx;
            replayRef.current.acc = 0;
        }
    };

    // 混沌对比开关：开启时从当前状态克隆并微扰出孪生系统
    const handleChaosToggle = () => {
        const next = !chaosMode;
        setChaosMode(next);
        twinTimelineRef.current = [];

        if (webSocketRef.current === null) {
            latestTwinRef.current = null;
            return;
        }

        const objects = latestObjectsRef.current;
        const twin = next ? perturbObjects(objects) : null;
        latestTwinRef.current = twin;
        send(startProtocol(objects, twin));
        if (playState === "paused") {
            send({star: true, Cmd: "pause"});
        }
    };

    const scrubTime = timelineRef.current[scrubIndex]?.[0]?.Time ?? 0;

    return (
        <div id="canvas-container">
            <Canvas camera={{position: cameraPosition, fov: 60}}>
                <color attach="background" args={["#040409"]}/>
                <ambientLight intensity={0.25}/>
                <directionalLight position={[5, 8, 5]} intensity={0.6}/>
                <Stars radius={120} depth={60} count={6000} factor={4} fade speed={0.6}/>
                {activeProto.Objects.objects.map((object, index) =>
                    <Object
                        key={`${sceneEpoch}-${index}`}
                        position={object.Position}
                        radius={bodyRadius}
                        trailWidth={bodyRadius * 2}
                        trailColor={TRAIL_COLORS[index % TRAIL_COLORS.length]}
                        getPosition={() => {
                            const latest = latestObjectsRef.current[index];
                            return latest === undefined ? null : latest.Position;
                        }}
                    />
                )}
                {(mode === "live" ? chaosMode : hasTwinReplay) && activeProto.Objects.objects.map((object, index) =>
                    <Object
                        key={`ghost-${sceneEpoch}-${index}`}
                        ghost
                        position={object.Position}
                        radius={bodyRadius}
                        trailWidth={bodyRadius}
                        trailColor={TRAIL_COLORS[index % TRAIL_COLORS.length]}
                        getPosition={() => {
                            const twin = latestTwinRef.current;
                            return twin === null || twin[index] === undefined ? null : twin[index].Position;
                        }}
                    />
                )}
                <Controls/>
            </Canvas>
            {showMetrics && (
                <ConservedPanel metricsRef={metricsRef} onClose={() => setShowMetrics(false)}/>
            )}
            <Card className={"btu-g"} sx={{px: 1.5, py: 0.5}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    <IconButton aria-label="重置" onClick={handleReset} disabled={mode === "live" && playState === "idle" && timelineLen === 0}>
                        <RestartAltIcon/>
                    </IconButton>
                    <IconButton aria-label={playState === "running" ? "暂停" : "播放"} onClick={handlePlay}>
                        {playState === "running"
                            ? <PauseIcon sx={{height: 34, width: 34}}/>
                            : <PlayArrowIcon sx={{height: 34, width: 34}}/>}
                    </IconButton>
                    <IconButton aria-label="单步" onClick={handleStep} disabled={mode === "live" && playState === "idle"}>
                        <SkipNextIcon/>
                    </IconButton>
                    <ToggleButtonGroup exclusive size="small" value={speed} onChange={handleSpeed} sx={{ml: 0.5}}>
                        {SPEED_OPTIONS.map((o) => (
                            <ToggleButton key={o.value} value={o.value} sx={{px: 1}}>{o.label}</ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <Select
                        size="small"
                        value={integrator}
                        onChange={handleIntegrator}
                        aria-label="积分器"
                        disabled={mode === "replay"}
                        sx={{ml: 0.5, fontSize: 13, minWidth: 96}}
                    >
                        <MenuItem value="verlet">Verlet</MenuItem>
                        <MenuItem value="rk4">RK4</MenuItem>
                        <MenuItem value="euler">Euler</MenuItem>
                    </Select>
                    <IconButton
                        aria-label="混沌对比"
                        title={`混沌对比：克隆当前初值并加 ${PERTURBATION} 扰动，同步演化孪生系统`}
                        onClick={handleChaosToggle}
                        disabled={mode === "replay"}
                        color={chaosMode ? "primary" : "default"}
                    >
                        <BlurOnIcon/>
                    </IconButton>
                    <IconButton
                        aria-label="守恒量面板"
                        onClick={() => setShowMetrics((v) => !v)}
                        color={showMetrics ? "primary" : "default"}
                    >
                        <ShowChartIcon/>
                    </IconButton>
                    <IconButton aria-label="导出录像" onClick={handleExportRecording} disabled={mode === "replay"}>
                        <FileDownloadIcon/>
                    </IconButton>
                    <IconButton aria-label="导入回放" onClick={() => fileInputRef.current.click()}>
                        <FileUploadIcon/>
                    </IconButton>
                    {mode === "replay" && (
                        <IconButton aria-label="退出回放" onClick={exitReplay} color="primary">
                            <EjectIcon/>
                        </IconButton>
                    )}
                    <input
                        type="file"
                        accept="application/json,.json"
                        ref={fileInputRef}
                        style={{display: 'none'}}
                        onChange={handleImportRecording}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ml: 1, minWidth: 48}}>
                        {mode === "replay"
                            ? (playState === "running" ? "回放中" : "回放暂停")
                            : (playState === "running" ? "运行中" : playState === "paused" ? "已暂停" : "待开始")}
                    </Typography>
                </Box>
                {playState === "paused" && timelineLen > 1 && (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, px: 1, pb: 0.5}}>
                        <Slider
                            size="small"
                            min={0}
                            max={timelineLen - 1}
                            value={scrubIndex}
                            onChange={handleScrub}
                            aria-label="时间轴"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{minWidth: 72}}>
                            t = {scrubTime.toFixed(2)}
                        </Typography>
                    </Box>
                )}
            </Card>
        </div>
    )
}
