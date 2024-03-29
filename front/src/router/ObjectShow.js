import {Canvas} from "@react-three/fiber";
import Object from "../view/Object";
import {Card, useTheme} from "@mui/material";
import {useState} from "react";
import {connect} from "../http/websocket";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';

let webSocket;

// 开启关闭触发变量
let toggle = true;

export default function Show(){
    const [objs, setObjs] = useState([]);

    const maps = objs.map(
        object => <Object position={object.psi}/>
    )

    // websocket回调函数
    function messageHandler(message){
        console.log(message)
        setObjs(message.data);
    }

    // websocket连接后端
    const startRunning = () => {
        const url = "ws://localhost:6750/v1/track";
        webSocket = connect(url, messageHandler);
        console.log(toggle);
        toggle = true;
    }

    // websocket断开连接
    const stopRunning = () => {
        if (webSocket !== null){
            webSocket.close();
            console.log(toggle);
            toggle = false;
        }
    }

    const theme = useTheme();

    // const buttons = [
    //     <Button key={"zuo"}> zuo </Button>,
    //     <Button key={"||"} onClick={ toggle===true ? startRunning : stopRunning }>||</Button>,
    //     <Button key={"you"}> you </Button>
    // ]

    return (
        <div id="canvas-container">
            <Canvas>
                {maps}
            </Canvas>
            <Card sx={{ display: 'flex' }} className={"btu-g"}>
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
            {/*<ButtonGroup*/}
            {/*    color="secondary"*/}
            {/*    orientation="horizontal"*/}
            {/*    size="large"*/}
            {/*    variant="filled"*/}
            {/*    className={"btu-g"}*/}
            {/*>*/}
            {/*    {buttons}*/}
            {/*</ButtonGroup>*/}
        </div>
    )
}