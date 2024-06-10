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


let webSocket;

// 开启关闭触发变量
let toggle = true;

export default function Show(){

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
        console.log("boolen" + objs.Star)
        let stringify = JSON.stringify(objs);
        webSocket = connect(url, stringify, messageHandler);
        console.log(toggle);
        toggle = false;
    }

    // websocket断开连接
    const stopRunning = () => {
        if (webSocket !== null){
            webSocket.close();
            console.log(toggle);
            toggle = true;
        }
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
                            {theme.direction === 'rtl' ? <SkipNextIcon /> : <SkipPreviousIcon />}
                        </IconButton>
                        <IconButton aria-label="play/pause">
                            <PlayArrowIcon sx={{ height: 38, width: 38 }} onClick={ toggle===true ? startRunning : stopRunning }/>
                        </IconButton>
                        <IconButton aria-label="next">
                            {theme.direction === 'rtl' ? <SkipPreviousIcon /> : <SkipNextIcon />}
                        </IconButton>
                    </Box>
                </Box>
            </Card>
        </div>
    )
}