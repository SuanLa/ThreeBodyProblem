import * as React from 'react';
import {Slider, Stack, Tab, Tabs, TextField} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import {useEffect, useState} from "react";
import Button from "@mui/material/Button";

import "./../css/Setting.css";

const G = 6.67e-8;

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
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}


function SettingPanel({value, index, velocity, callback}){
    useEffect(() => {
        setMinVelocity(velocity[0]);
        setMaxVelocity(velocity[1]);
    }, [velocity]);

    const judge = (event) => {
        if(event.target.value < 10000){
            alert("mess is too tidy!");
        }
    }

    // 速度上界
    const [maxVelocity, setMaxVelocity] = useState(100);
    // 速度下界
    const [minVelocity, setMinVelocity] = useState(200);

    let objInit = {
        Mess: 10000,
        Position: {
            X: 0,
            Y: 0,
            Z: 0
        },
        Speed: {
            XSpeed: 0,
            YSpeed: 0,
            ZSpeed: 0
        },
        Time: 0
    }

    const [obj, setObj] = useState(objInit);

    return (
        <TabPanel value={value} index={index}>
            <Stack spacing={2}>
                <TextField
                    id="filled-number"
                    label="质量"
                    type="number"
                    defaultValue={obj.Mess}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    onChange={judge}
                    variant="filled"
                />
                <TextField
                    id="filled-number"
                    label="坐标X"
                    type="number"
                    defaultValue={obj.Position.X}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="filled"
                />
                <TextField
                    id="filled-number"
                    label="坐标Y"
                    type="number"
                    defaultValue={obj.Position.Y}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="filled"
                />
                <TextField
                    id="filled-number"
                    label="坐标Z"
                    type="number"
                    defaultValue={obj.Position.Z}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    variant="filled"
                />

                <Box sx={{ width: 300 }}>
                    速度
                    <Slider
                        aria-label="velocity marks"
                        min={minVelocity}
                        max={maxVelocity}
                        step={10}
                        valueLabelDisplay="auto"
                    />
                </Box>

                <Button variant="contained" color="success" onClick={callback(obj, index)} className={"buttonPsi"} >
                    确认
                </Button>
            </Stack>
        </TabPanel>
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

export default function Setting() {
    const [value, setValue] = React.useState(0);

    // 外接圆半径
    let r;

    // 计算向量的叉积
    function crossProduct(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    // 数据初始化
    const calculateCircumcenter =  (arr) => {
        // 计算三角形的法向量
        let edge1 = [arr[1].Position.X - arr[0].Position.X, arr[1].Position.Y - arr[0].Position.Y, arr[1].Position.Z - arr[1].Position.Z];
        let edge2 = [arr[2].Position.X - arr[0].Position.X, arr[2].Position.Y - arr[0].Position.Y, arr[2].Position.Z - arr[0].Position.Z];
        let normal = crossProduct(edge1, edge2);

        // 计算三边的中点
        let midPoint1 = [(arr[0] + arr[1]) / 2, (arr[0] + arr[1]) / 2, (arr[0] + arr[1]) / 2];
        let midPoint2 = [(arr[1] + arr[2]) / 2, (arr[1] + arr[2]) / 2, (arr[1] + arr[2]) / 2];

        // 计算外接圆的圆心
        let circumcenter = crossProduct(normal, crossProduct(midPoint1, midPoint2));

        // 求出外接圆的半径
        r = Math.sqrt((circumcenter[0]-arr[0].Position.X)*(circumcenter[0]-arr[0].Position.X) +
            (circumcenter[1]-arr[0].Position.Y) * (circumcenter[1]-arr[0].Position.Y) +
            (circumcenter[2]-arr[0].Position.Z) * (circumcenter[2]-arr[0].Position.Z));

        for (let i = 0; i < 3; i++) {
            let toVector = solveLinearEquations(pointsToVector(objArr[i], circumcenter), normal, objArr[i]);
            let speed = velocityMarshal(velocity, toVector);
            objArr[i].Speed.XSpeed = speed[0];
            objArr[i].Speed.YSpeed = speed[1];
            objArr[i].Speed.ZSpeed = speed[2];
        }
    }

    // 将两个三维点转化为向量
    function pointsToVector(point1, point2) {
        // 计算差值
        let deltaX = point2[0] - point1[0];
        let deltaY = point2[1] - point1[1];
        let deltaZ = point2[2] - point1[2];

        // 构建向量
        let vector = [deltaX, deltaY, deltaZ];
        return vector;
    }

    // 外积法
    function solveLinearEquations(vector1, vector2, point) {
        // 向量坐标
        let solutions = [];

        //求外积
        for (let j = 0; j < 3; j++) {
            let index = [], sum = 0, total = 0;
            for (let k = 0; k < 3; k++) {
                if(k !== j){
                    index[sum] = j;
                    sum++;
                }
            }
            total += vector1[index[0]] * vector2[index[1]] + vector1[index[1]] * vector1[index[0]];
            solutions[j] = total;
        }

        return solutions;
    }

    // 速度解析
    function velocityMarshal(velocity, vector){

        let length =0;
        for (let i = 0; i < 3; i++) {
            length += vector[i] * vector[i];
        }

        length = Math.sqrt(length);

        let result = [];
        for (let i = 0; i < 3; i++) {
            result[i] = velocity * (length/vector[i]);
        }

        return result;
    }

    // 速度范围计算
    function calculateVelocity(index){

        if (objArr.length===3){
            let F = 0;
            for (let i = 0; i < objArr.length; i++) {
                if(i!==index){
                    let messSum = objArr[index].Mess * objArr[i].Mess;
                    let d = Math.sqrt((objArr[i].Position.X-objArr[index].Position.X) * (objArr[i].Position.X-objArr[index].Position.X) +
                        (objArr[i].Position.Y-objArr[index].Position.Y) * (objArr[i].Position.Y-objArr[index].Position.Y) +
                        (objArr[i].Position.Z-objArr[index].Position.Z) * (objArr[i].Position.Z-objArr[index].Position.Z));

                    // 两个物体间的万有引力
                    let temp = G * messSum / (d * d);

                    F += temp / (d/r);
                }
            }

            // 返回逃逸速度
            return F/objArr[index].Mess * r;
        }else {
            return 0;
        }
    }

    // 协议解析
    function Marshal(map){
        // 方向坐标
        // let position = [];
        // //根据向量得出点坐标
        // for (let i = 0; i < 3; i++) {
        //     position[i] = solutions[i] + point[i];
        // }

        let stringify = JSON.stringify(map);
        sessionStorage.setItem("protocol", stringify)
    }

    let objArr = [];
    let protocolData = {
        Star: 0,
        Timestamp: Math.floor(Date.now() / 1000),
        Objects: {
            objects: objArr
        },
        SleepTime: 1
    };

    const [velocity, setVelocity] = useState();

    // 数据变化一次就持久化一次
    useEffect(() => {
        if (objArr.length === 3){
            calculateCircumcenter(objArr);
        }

        // 速度范围计算一次
        setVelocity(calculateVelocity(0));
        protocolData.Objects.objects = objArr;
        Marshal(protocolData);
    }, [objArr]);

    // 回调函数
    const callBackFuc = (map, index) => {
        objArr[index] = map;
    }

    return (
        <Box
            sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 224 }}
            className={ "setContainer" }
        >
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                aria-label="Vertical tabs example"
                sx={{ borderRight: 1, borderColor: 'divider' }}
            >
                <Tab label="物体一" {...a11yProps(0)} />
                <Tab label="物体二" {...a11yProps(1)} />
                <Tab label="物体三" {...a11yProps(2)} />
            </Tabs>
            <SettingPanel value={value} index={0} velocity={[velocity - velocity/2, velocity + velocity/2]} callback={callBackFuc}/>
            <SettingPanel value={value} index={1} velocity={[velocity - velocity/2, velocity + velocity/2]} callback={callBackFuc}/>
            <SettingPanel value={value} index={2} velocity={[velocity - velocity/2, velocity + velocity/2]} callback={callBackFuc}/>
        </Box>
    );
}