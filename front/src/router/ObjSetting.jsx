import * as React from 'react';
import {Slider, Stack, Tab, Tabs, TextField} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import {useEffect, useState} from "react";

import "./../css/Setting.css";
import Button from "@mui/material/Button";

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


/**
 *
 * @param value
 * @param index
 * @param velocity
 * @param callback
 * @param objVal
 * @returns {Element}
 * @constructor
 */
function SettingPanel({value, index, velocity, callback, objVal}){
    useEffect(() => {
        setMinVelocity(velocity[0]);
        setMaxVelocity(velocity[1]);
    }, [velocity]);

    // 速度上界
    const [maxVelocity, setMaxVelocity] = useState(100);
    // 速度下界
    const [minVelocity, setMinVelocity] = useState(200);

    const obj = objVal;

    let speed = 0;

    const judge = (event) => {

        if(event.target.value < 10000){
            alert("mess is too tidy!");
        }

        obj.Mess = event.target.value;
    }

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
                    onChange={event => {obj.Position.X = event.target.value}}
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
                    onChange={event => {obj.Position.Y = event.target.value}}
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
                    onChange={event => {obj.Position.Z = event.target.value}}
                    variant="filled"
                />

                <Box sx={{ width: 300 }}>
                    速度
                    <Slider
                        aria-label="velocity marks"
                        min={minVelocity}
                        max={maxVelocity}
                        step={10}
                        onChange={event => {speed = event.target.value}}
                        valueLabelDisplay="auto"
                    />
                </Box>
            </Stack>

            <Button variant="contained" color="success" onClick={callback(obj, speed, index)} className={"buttonPsi"} >
                确认
            </Button>
        </TabPanel>
    );
}

/**
 *
 * @type {{children: Requireable<ReactNodeLike>, index: Validator<NonNullable<number>>, value: Validator<NonNullable<number>>}}
 */
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

    let circumCenter;

    let objsRang = [[0, 0], [0 ,0], [0, 0]];

    const objsInit = () => {
        let item = sessionStorage.getItem("protocol");
        if (item !== null){
            console.log("协议数据"+item)
            let parse = JSON.parse(item);
            return parse.Objects.objects;
        }else {
            return [{
                Mess: 10000,
                Position: {
                    X: 0,
                    Y: 4,
                    Z: 0
                },
                Speed: {
                    XSpeed: -0.008,
                    YSpeed: 0,
                    ZSpeed: 0
                },
                Time: 0
            }, {
                Mess: 10000,
                Position: {
                    X: 3.464,
                    Y: -2,
                    Z: 0
                },
                Speed: {
                    XSpeed: 0.004,
                    YSpeed: 0.0069,
                    ZSpeed: 0
                },
                Time: 0
            }, {
                Mess: 10000,
                Position: {
                    X: -3.464,
                    Y: -2,
                    Z: 0
                },
                Speed: {
                    XSpeed: 0.004,
                    YSpeed: -0.0069,
                    ZSpeed: 0
                },
                Time: 0
            }];
        }
    }

    const [objArr, setObjArr] = useState(objsInit);

    const [status, setStatus] = useState(0);

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

    // 向量相加
    function addVectors(v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
    }

    // 向量相减
    function subtractVectors(v1, v2) {
        return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
    }

    // 向量的长度
    function vectorLength(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    // 计算切向量
    function tangentVector(index, O) {
        console.log(index, O)

        let arr = [];
        let sum = 0;
        for (let i = 0; i < 3; i++) {
            if(i !== index){
                arr[sum] = subtractVectors([objArr[i].Position.X, objArr[i].Position.Y, objArr[i].Position.Z], [objArr[index].Position.X, objArr[index].Position.Y, objArr[index].Position.Z]);
                sum++;
            }
        }
        let OA = subtractVectors([objArr[index].Position.X, objArr[index].Position.Y, objArr[index].Position.Z], O);

        let T1 = crossProduct(OA, arr[0]);
        let T2 = crossProduct(OA, arr[1]);

        // 归一化向量 T1
        let T1_length = vectorLength(T1);
        let T1_normalized = T1.map(component => component / T1_length);

        // 检查向量是否垂直于 OA
        if (dotProduct(T1_normalized, OA) === 0) {
            return T1_normalized;
        } else {
            // 如果 T1 不垂直于 OA，返回 T2 归一化
            let T2_length = vectorLength(T2);
            return T2.map(component => component / T2_length);
        }
    }

    // 数据初始化
    const calculateCircumcenter =  () => {
        // 计算三角形的法向量
        let edge1 = [objArr[1].Position.X - objArr[0].Position.X, objArr[1].Position.Y - objArr[0].Position.Y, objArr[1].Position.Z - objArr[1].Position.Z];
        let edge2 = [objArr[2].Position.X - objArr[0].Position.X, objArr[2].Position.Y - objArr[0].Position.Y, objArr[2].Position.Z - objArr[0].Position.Z];
        let normal = crossProduct(edge1, edge2);
        console.log(normal)

        // 计算三边的中点
        let midPoint1 = [(objArr[0].Position.X + objArr[1].Position.X) / 2, (objArr[0].Position.Y + objArr[1].Position.Y) / 2, (objArr[0].Position.Z + objArr[1].Position.Z) / 2];
        let midPoint2 = [(objArr[1].Position.X + objArr[2].Position.X) / 2, (objArr[1].Position.Y + objArr[2].Position.Y) / 2, (objArr[1].Position.Z + objArr[2].Position.Z) / 2];

        // 计算外接圆的圆心
        circumCenter = crossProduct(normal, crossProduct(midPoint1, midPoint2));
        console.log(circumCenter)

        // 求出外接圆的半径
        r = Math.sqrt((circumCenter[0]-objArr[0].Position.X)*(circumCenter[0]-objArr[0].Position.X) +
            (circumCenter[1]-objArr[0].Position.Y) * (circumCenter[1]-objArr[0].Position.Y) +
            (circumCenter[2]-objArr[0].Position.Z) * (circumCenter[2]-objArr[0].Position.Z));

        console.log("外接圆半径" + r)

        let stringify = JSON.stringify(objArr);
        let parse = JSON.parse(stringify);
        console.log("对象数组：", parse)

        for (let i = 0; i < 3; i++) {
            // 求切向量
            let vector = tangentVector(i, circumCenter);
            console.log("星体"+ (i+1)+ "切向量"+ vector);

            // 求临界速度
            // let toVector = solveLinearEquations(pointsToVector(parse[i], circumCenter), normal, parse[i]);
            // let speed = velocityMarshal(parse[i], toVector);
            let velocity = calculateVelocity(i);
            console.log(velocity)

            parse[i].Speed.XSpeed = vector[0] * velocity;
            parse[i].Speed.YSpeed = vector[1] * velocity;
            parse[i].Speed.ZSpeed = vector[2] * velocity;
        }
        console.log(parse);
        setObjArr(parse);
    }

    // 计算临界速度
    function calculateVelocity(index){

        if (objArr.length===3){
            let force = 0;
            for (let i = 0; i < objArr.length; i++) {
                if(i!==index){
                    let messSum = objArr[index].Mess * objArr[i].Mess;
                    let distance = Math.sqrt((objArr[i].Position.X-objArr[index].Position.X) * (objArr[i].Position.X-objArr[index].Position.X) +
                        (objArr[i].Position.Y-objArr[index].Position.Y) * (objArr[i].Position.Y-objArr[index].Position.Y) +
                        (objArr[i].Position.Z-objArr[index].Position.Z) * (objArr[i].Position.Z-objArr[index].Position.Z));

                    // 两个物体间的万有引力
                    let universal = G * messSum / (distance * distance);

                    force += universal / (distance/r);
                }
            }

            // 返回临界速度
            let res = force / objArr[index].Mess * r;
            return Math.sqrt(res);
        }else {
            return 0;
        }
    }

    // 协议解析
    function Marshal(map){

        let stringify = JSON.stringify(map);
        sessionStorage.setItem("protocol", stringify)
    }

    // 协议其他数据
    let protocolData = {
        Star: true,
        Timestamp: Math.floor(Date.now() / 1000),
        Objects: {
            objects: objArr
        },
        SleepTime: 1
    };


    // 状态变化一次就持久化一次
    useEffect(() => {
        if (objArr.length === 3){
            calculateCircumcenter();
        }

        for (let i = 0; i < 3; i++) {
            let velocity = calculateVelocity(i);
            objsRang[i][0] = velocity * 0.5;
            objsRang[i][1] = velocity + (velocity * 0.5);
        }

        protocolData.Objects.objects = objArr;
        protocolData.Timestamp = Math.floor(Date.now() / 1000);
        Marshal(protocolData);
    }, []);

    // 回调函数
    const callBackFuc = (map, speed, index) => {
        console.log(map);
        objArr[index].Mess = map.Mess;
        objArr[index].Position.X = map.Position.X;
        objArr[index].Position.Y = map.Position.Y;
        objArr[index].Position.Z = map.Position.Z;

        if (circumCenter !== undefined){
            // 求切向量
            let vector = tangentVector(index, circumCenter);
            console.log("星体"+ (index+1)+ "切向量"+ vector);

            let velocity = calculateVelocity(index);
            console.log(velocity)

            let stringify = JSON.stringify(objArr);
            let parse = JSON.parse(stringify);

            parse[index].Speed.XSpeed = vector[0] * velocity;
            parse[index].Speed.YSpeed = vector[1] * velocity;
            parse[index].Speed.ZSpeed = vector[2] * velocity;

            setObjArr(parse);
        }

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


            <SettingPanel value={value}
                          index={0}
                          velocity={objsRang[0]}
                          callback={callBackFuc}
                          objVal={objArr[0]}
            />
            <SettingPanel value={value}
                          index={1}
                          velocity={objsRang[0]}
                          callback={callBackFuc}
                          objVal={objArr[1]}
            />
            <SettingPanel value={value}
                          index={2}
                          velocity={objsRang[0]}
                          callback={callBackFuc}
                          objVal={objArr[2]}
            />
        </Box>
    );
}