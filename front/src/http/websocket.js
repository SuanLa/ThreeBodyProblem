let ws;

function connect(){
    ws = new WebSocket("ws://localhost:6750/v1/test");
    ws.onopen = () => {
        ws.send("ping")
    }

    ws.onmessage = (event) => {
        if (event.data !== "pong"){
            ws.close()
        }
    }
}