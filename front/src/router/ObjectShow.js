import {Canvas} from "@react-three/fiber";
import Object from "../view/Object";
import {Button, ButtonGroup} from "@mui/material";
import {useState} from "react";
import {connect} from "../http/websocket";

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
        const url = "ws://localhost:6750/v1/test";
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

    const buttons = [
        <Button key={"zuo"}> zuo </Button>,
        <Button key={"||"} onClick={ toggle===true ? startRunning : stopRunning }>||</Button>,
        <Button key={"you"}> you </Button>
    ]

    return (
        <div id="canvas-container">
            <Canvas>
                {maps}
            </Canvas>
            <ButtonGroup
                color="secondary"
                orientation="horizontal"
                size="large"
                variant="filled"
                className={"btu-g"}
            >
                {buttons}
            </ButtonGroup>
        </div>
    )
}