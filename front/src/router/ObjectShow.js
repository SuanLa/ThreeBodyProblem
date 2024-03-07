import {Canvas} from "@react-three/fiber";
import Object from "../view/Object";
import {Button, ButtonGroup} from "@mui/material";
import {useState} from "react";
import {connect} from "../http/websocket";

let webSocket;

const objs = new useState([]);

const maps = objs.map(
    object => <Object position={object.psi}/>
)

// websocket回调函数
function messageHandler(message){
    objs.splice(message.data);
}

// websocket连接后端
const startRunning = () => {
    const url = "ws://localhost:6750/v1/test";
    webSocket = connect(url, messageHandler);
}

// websocket断开连接
const stopRunning = () => {
    if (webSocket !== null){
        webSocket.close();
    }
}

export default function Show(){
    const buttons = [
        <Button key={"zuo"}> zuo </Button>,
        <Button key={"||"} onClick={startRunning}>||</Button>,
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