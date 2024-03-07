
export function connect(url, handlerMessage) {
    const ws = new WebSocket(url);

    ws.onopen = () => {
        ws.send("ping");
    };

    ws.onmessage = (event) => {
        if (event.data !== "pong"){
            ws.close();
        }else {
            handlerMessage(event.data)
        }
    };

    ws.onclose = (event) => {
        console.log(event.data);
    };

    ws.onerror = (event) => {
        console.log(event.data);
    };

    return ws
}