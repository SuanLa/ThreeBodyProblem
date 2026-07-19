import * as React from 'react';
import {useEffect, useState} from "react";
import {Slider, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import PropTypes from "prop-types";
import CasinoIcon from '@mui/icons-material/Casino';
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from "@mui/material/IconButton";
import {useRef} from "react";

import {PRESETS, buildPresetProtocol} from "../presets/presets";
import {listSchemes, saveScheme, removeScheme, downloadJSON, readJSONFile, isScheme} from "../store/schemes";
import "./../css/Setting.css";

// 自定义模式下的引力常数，与后端默认值保持一致
const G = 6.67e-8;

const MANUAL_DESCRIPTION = "手动配置三个天体的质量、位置与速度，速度按外接圆临界速度自动计算。";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography component="div">{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

function SettingPanel({value, index, velocity, callback, objVal, disabled}){
    const obj = objVal;

    let speed = 0;

    return (
        <TabPanel value={value} index={index}>
            <Stack spacing={2}>
                <TextField
                    label="质量"
                    type="number"
                    defaultValue={obj.Mess}
                    InputLabelProps={{ shrink: true }}
                    onChange={event => {obj.Mess = Number(event.target.value)}}
                    variant="filled"
                    disabled={disabled}
                />
                <TextField
                    label="坐标X"
                    type="number"
                    defaultValue={obj.Position.X}
                    InputLabelProps={{ shrink: true }}
                    onChange={event => {obj.Position.X = Number(event.target.value)}}
                    variant="filled"
                    disabled={disabled}
                />
                <TextField
                    label="坐标Y"
                    type="number"
                    defaultValue={obj.Position.Y}
                    InputLabelProps={{ shrink: true }}
                    onChange={event => {obj.Position.Y = Number(event.target.value)}}
                    variant="filled"
                    disabled={disabled}
                />
                <TextField
                    label="坐标Z"
                    type="number"
                    defaultValue={obj.Position.Z}
                    InputLabelProps={{ shrink: true }}
                    onChange={event => {obj.Position.Z = Number(event.target.value)}}
                    variant="filled"
                    disabled={disabled}
                />

                <Box sx={{ width: 300 }}>
                    速度
                    <Slider
                        aria-label="velocity marks"
                        min={velocity[0]}
                        max={velocity[1]}
                        step={10}
                        onChange={event => {speed = event.target.value}}
                        valueLabelDisplay="auto"
                        disabled={disabled}
                    />
                </Box>
            </Stack>

            <Button
                variant="contained"
                color="success"
                onClick={() => callback(obj, speed, index)}
                className={"buttonPsi"}
                disabled={disabled}
            >
                确认
            </Button>
        </TabPanel>
    );
}

// 自定义模式的默认天体
function defaultManualObjects() {
    return [{
        Mess: 10000,
        Position: { X: 1, Y: -2, Z: 5 },
        Speed: { XSpeed: 0.001, YSpeed: -0.001, ZSpeed: 0.001 },
        Time: 0
    }, {
        Mess: 10000,
        Position: { X: 1, Y: 3, Z: 2 },
        Speed: { XSpeed: 0.001, YSpeed: 0.001, ZSpeed: 0.001 },
        Time: 0
    }, {
        Mess: 10000,
        Position: { X: -1, Y: -5, Z: 0 },
        Speed: { XSpeed: -0.001, YSpeed: -0.001, ZSpeed: 0 },
        Time: 0
    }];
}

export default function Setting() {
    const [tab, setTab] = useState(0);

    const [storedProtocol] = useState(() => {
        const item = sessionStorage.getItem("protocol");
        return item === null ? null : JSON.parse(item);
    });

    const [activePreset, setActivePreset] = useState(
        storedProtocol && storedProtocol.Preset ? storedProtocol.Preset : "manual"
    );
    const [objArr, setObjArr] = useState(
        storedProtocol ? storedProtocol.Objects.objects : defaultManualObjects
    );
    // 预设应用后递增，强制重建非受控输入组件
    const [panelEpoch, setPanelEpoch] = useState(0);

    // 已保存的参数方案
    const [schemes, setSchemes] = useState(listSchemes);
    const [schemeName, setSchemeName] = useState("");
    const importInputRef = useRef(null);

    // 外接圆半径与圆心，由 computeTangentVelocities 填充
    let r;
    let circumCenter;

    let objsRang = [[0, 0], [0, 0], [0, 0]];

    // 计算向量的叉积
    function crossProduct(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    // 向量点积
    function dotProduct(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    }

    // 向量相减
    function subtractVectors(v1, v2) {
        return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
    }

    // 向量的长度
    function vectorLength(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    // 计算 index 天体相对圆心 O 的切向量
    function tangentVector(arr, index, O) {
        let others = [];
        let sum = 0;
        for (let i = 0; i < 3; i++) {
            if (i !== index) {
                others[sum] = subtractVectors(
                    [arr[i].Position.X, arr[i].Position.Y, arr[i].Position.Z],
                    [arr[index].Position.X, arr[index].Position.Y, arr[index].Position.Z]
                );
                sum++;
            }
        }
        let OA = subtractVectors([arr[index].Position.X, arr[index].Position.Y, arr[index].Position.Z], O);

        let T1 = crossProduct(OA, others[0]);
        let T2 = crossProduct(OA, others[1]);

        let T1_length = vectorLength(T1);
        let T1_normalized = T1.map(component => component / T1_length);

        if (dotProduct(T1_normalized, OA) === 0) {
            return T1_normalized;
        } else {
            let T2_length = vectorLength(T2);
            return T2.map(component => component / T2_length);
        }
    }

    // 计算 index 天体的临界速度
    function calculateVelocity(arr, index) {
        if (arr.length === 3 && r) {
            let force = 0;
            for (let i = 0; i < arr.length; i++) {
                if (i !== index) {
                    let messSum = arr[index].Mess * arr[i].Mess;
                    let distance = Math.sqrt(
                        (arr[i].Position.X - arr[index].Position.X) ** 2 +
                        (arr[i].Position.Y - arr[index].Position.Y) ** 2 +
                        (arr[i].Position.Z - arr[index].Position.Z) ** 2
                    );

                    // 两个物体间的万有引力
                    let universal = G * messSum / (distance * distance);

                    force += universal / (distance / r);
                }
            }

            let res = force / arr[index].Mess * r;
            return Math.sqrt(res);
        }
        return 0;
    }

    // 计算外接圆并为三个天体设置切向临界速度，返回新的对象数组
    function computeTangentVelocities(arr) {
        let edge1 = [
            arr[1].Position.X - arr[0].Position.X,
            arr[1].Position.Y - arr[0].Position.Y,
            arr[1].Position.Z - arr[0].Position.Z
        ];
        let edge2 = [
            arr[2].Position.X - arr[0].Position.X,
            arr[2].Position.Y - arr[0].Position.Y,
            arr[2].Position.Z - arr[0].Position.Z
        ];
        let normal = crossProduct(edge1, edge2);

        let midPoint1 = [(arr[0].Position.X + arr[1].Position.X) / 2, (arr[0].Position.Y + arr[1].Position.Y) / 2, (arr[0].Position.Z + arr[1].Position.Z) / 2];
        let midPoint2 = [(arr[1].Position.X + arr[2].Position.X) / 2, (arr[1].Position.Y + arr[2].Position.Y) / 2, (arr[1].Position.Z + arr[2].Position.Z) / 2];

        circumCenter = crossProduct(normal, crossProduct(midPoint1, midPoint2));

        r = Math.sqrt(
            (circumCenter[0] - arr[0].Position.X) ** 2 +
            (circumCenter[1] - arr[0].Position.Y) ** 2 +
            (circumCenter[2] - arr[0].Position.Z) ** 2
        );

        const next = JSON.parse(JSON.stringify(arr));
        for (let i = 0; i < 3; i++) {
            let vector = tangentVector(arr, i, circumCenter);
            let velocity = calculateVelocity(arr, i);

            next[i].Speed.XSpeed = vector[0] * velocity;
            next[i].Speed.YSpeed = vector[1] * velocity;
            next[i].Speed.ZSpeed = vector[2] * velocity;
        }
        return next;
    }

    // 自定义模式协议持久化（不带 G/Dt/Method，后端使用默认值，与旧版行为一致）
    const persistManual = (arr) => {
        sessionStorage.setItem("protocol", JSON.stringify({
            Star: true,
            Timestamp: Math.floor(Date.now() / 1000),
            SleepTime: 1,
            Preset: "manual",
            Objects: {objects: arr},
        }));
    };

    // 首次进入且处于自定义模式时，计算临界速度并持久化
    useEffect(() => {
        if (activePreset !== "manual") {
            return;
        }

        let arr = objArr;
        if (arr.length === 3) {
            arr = computeTangentVelocities(arr);
            setObjArr(arr);
        }

        for (let i = 0; i < 3; i++) {
            let velocity = calculateVelocity(arr, i);
            objsRang[i][0] = velocity * 0.5;
            objsRang[i][1] = velocity * 1.5;
        }

        persistManual(arr);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 面板确认回调：应用手动修改并重算临界速度
    const applyManualEdit = (map, speed, index) => {
        const next = JSON.parse(JSON.stringify(objArr));
        next[index].Mess = Number(map.Mess);
        next[index].Position.X = Number(map.Position.X);
        next[index].Position.Y = Number(map.Position.Y);
        next[index].Position.Z = Number(map.Position.Z);

        const withVelocities = next.length === 3 ? computeTangentVelocities(next) : next;
        setObjArr(withVelocities);
        persistManual(withVelocities);
        setPanelEpoch(e => e + 1);
    };

    // 应用预设
    const applyPreset = (id) => {
        if (id === null) {
            return; // ToggleButtonGroup 重复点击当前项时回调 null，忽略
        }

        setActivePreset(id);

        if (id === "manual") {
            persistManual(objArr);
            return;
        }

        const preset = PRESETS.find((p) => p.id === id);
        const proto = buildPresetProtocol(preset);
        sessionStorage.setItem("protocol", JSON.stringify(proto));
        setObjArr(proto.Objects.objects);
        setPanelEpoch(e => e + 1);
    };

    // 读取当前生效的完整协议（sessionStorage 由预设/手动编辑流程维护）
    const currentProtocol = () => {
        const item = sessionStorage.getItem("protocol");
        return item === null ? null : JSON.parse(item);
    };

    const handleSaveScheme = () => {
        const proto = currentProtocol();
        if (proto === null) {
            return;
        }
        const name = schemeName.trim() || `方案 ${new Date().toLocaleString()}`;
        setSchemes(saveScheme(name, proto));
        setSchemeName("");
    };

    const applyProtocol = (proto) => {
        sessionStorage.setItem("protocol", JSON.stringify(proto));
        setObjArr(proto.Objects.objects);
        setActivePreset(proto.Preset || "manual");
        setPanelEpoch(e => e + 1);
    };

    const handleImportScheme = async (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        try {
            const data = await readJSONFile(file);
            if (!isScheme(data)) {
                alert("不是有效的参数方案文件");
                return;
            }
            const name = data.name || file.name.replace(/\.json$/i, "");
            setSchemes(saveScheme(name, data.protocol));
            applyProtocol(data.protocol);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleExportScheme = (scheme) => {
        downloadJSON(`${scheme.name}.json`, {
            type: "threebody-scheme",
            version: 1,
            name: scheme.name,
            protocol: scheme.protocol,
        });
    };

    const activeDescription = activePreset === "manual"
        ? MANUAL_DESCRIPTION
        : PRESETS.find((p) => p.id === activePreset).description;

    const disabled = activePreset !== "manual";

    return (
        <Box
            sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}
            className={ "setContainer" }
        >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        color="primary"
                        value={activePreset}
                        onChange={(event, id) => applyPreset(id)}
                    >
                        <ToggleButton value="manual">自定义</ToggleButton>
                        {PRESETS.map((p) => (
                            <ToggleButton key={p.id} value={p.id}>{p.name}</ToggleButton>
                        ))}
                    </ToggleButtonGroup>

                    {activePreset === "random" && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CasinoIcon/>}
                            onClick={() => applyPreset("random")}
                        >
                            换一组
                        </Button>
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {activeDescription}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        label="方案名称"
                        value={schemeName}
                        onChange={(e) => setSchemeName(e.target.value)}
                        sx={{ width: 180 }}
                    />
                    <Button size="small" variant="outlined" startIcon={<SaveIcon/>} onClick={handleSaveScheme}>
                        保存当前方案
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<FileUploadIcon/>} onClick={() => importInputRef.current.click()}>
                        导入方案
                    </Button>
                    <input
                        type="file"
                        accept="application/json,.json"
                        ref={importInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImportScheme}
                    />
                </Box>

                {schemes.length > 0 && (
                    <Box sx={{ mt: 1, maxHeight: 120, overflowY: 'auto' }}>
                        {schemes.map((s) => (
                            <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.25 }}>
                                <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {s.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(s.savedAt).toLocaleDateString()}
                                </Typography>
                                <Button size="small" onClick={() => applyProtocol(s.protocol)}>载入</Button>
                                <IconButton size="small" aria-label={`导出方案 ${s.name}`} onClick={() => handleExportScheme(s)}>
                                    <FileDownloadIcon fontSize="inherit"/>
                                </IconButton>
                                <IconButton size="small" aria-label={`删除方案 ${s.name}`} onClick={() => setSchemes(removeScheme(s.name))}>
                                    <DeleteIcon fontSize="inherit"/>
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            <Box key={panelEpoch} sx={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={tab}
                    onChange={(event, v) => setTab(v)}
                    aria-label="object settings tabs"
                    sx={{ borderRight: 1, borderColor: 'divider' }}
                >
                    <Tab label="物体一" {...a11yProps(0)} />
                    <Tab label="物体二" {...a11yProps(1)} />
                    <Tab label="物体三" {...a11yProps(2)} />
                </Tabs>

                {objArr.map((obj, i) => (
                    <SettingPanel
                        key={i}
                        value={tab}
                        index={i}
                        velocity={objsRang[i]}
                        callback={applyManualEdit}
                        objVal={obj}
                        disabled={disabled}
                    />
                ))}
            </Box>
        </Box>
    );
}
