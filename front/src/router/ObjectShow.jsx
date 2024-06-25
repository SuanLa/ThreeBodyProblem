import {Canvas} from "@react-three/fiber";
import Object from "../component/Object";
import {Card, useTheme} from "@mui/material";
import {useState} from "react";
import {connect} from "../http/websocket";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Controls from "../component/Control";


export default function Show(){
    let webSocket;

    // 开启关闭触发变量
    const [toggle, setToggle] = useState(false);

    // 初始化组件
    function init(){
        let obj = sessionStorage.getItem("protocol");
        return JSON.parse(obj);
    }

    const [objs, setObjs] = useState(init);

    // websocket回调函数
    function messageHandler(message){
        let parse = JSON.parse(message);
        // console.log(parse)
        setObjs(parse);
        // console.log(objs)
    }

    // websocket连接后端
    const startRunning = () => {
        const url = "ws://localhost:6750/v1/track";
        console.log("boolean" + objs.Star)
        let item = sessionStorage.getItem("protocol");
        let parse = JSON.parse(item);
        parse.Star = true;
        setObjs(parse);

        let stringify = JSON.stringify(objs);
        webSocket = connect(url, stringify, messageHandler);
        console.log("starBefore => " + toggle);
        setToggle(false);
        console.log("starAfter => " + toggle);
    }

    // websocket断开连接
    const stopRunning = () => {
            objs.Star = false;
            let stringify = JSON.stringify(objs);
            sessionStorage.setItem("protocol", stringify);

            webSocket.close();
            console.log("stopBefore => " + toggle);
            setToggle(true);
            console.log("stopAfter => " + toggle);

    }

    const theme = useTheme();

    return (
        <div id="canvas-container">
            <Canvas>
                {objs.Objects.objects.map((object, index) => <Object key={index} position={object.Position}/>)}
                <Controls/>
            </Canvas>
            <Card sx={{display: 'flex'}} className={"btu-g"}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
                        <IconButton aria-label="previous">
                            <SkipPreviousIcon onClick={() => setObjs(objs.SleepTime * 0.5)}/>
                        </IconButton>
                        <IconButton aria-label="play/pause">
                            <PlayArrowIcon sx={{ height: 38, width: 38 }} onClick={ toggle===true ? startRunning : stopRunning }/>
                        </IconButton>
                        <IconButton aria-label="next">
                            <SkipNextIcon onClick={() => {setObjs(objs.SleepTime * 2); console.log(objs)}}/>
                        </IconButton>
                    </Box>
                </Box>
            </Card>
        </div>
    )
}