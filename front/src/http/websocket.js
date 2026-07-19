
export function connect(url, msg, handlerMessage, handlerClose) {
    const ws = new WebSocket(url);

    ws.onopen = () => {
        ws.send(msg);
    };

    ws.onmessage = (event) => {
        handlerMessage(event.data)
    };

    ws.onclose = (event) => {
        if (handlerClose) {
            handlerClose(event)
        }
    };

    ws.onerror = (event) => {
        console.log(event);
    };

    return ws
}