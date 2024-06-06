
export function connect(url, msg, handlerMessage) {
    const ws = new WebSocket(url);

    ws.onopen = () => {
        ws.send(msg);
    };

    ws.onmessage = (event) => {
        // console.log(event)
        handlerMessage(event.data)
    };

    ws.onclose = (event) => {
        console.log(event);
    };

    ws.onerror = (event) => {
        console.log(event);
    };

    return ws
}