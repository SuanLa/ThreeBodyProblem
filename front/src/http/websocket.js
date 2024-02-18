let ws;

function connect(){
    ws = new WebSocket("ws://localhost:6750/ws");
    ws.onopen = () => {
        ws.send("ping")
    }

    ws.onmessage = (event) => {
        if (event.data !== "pong"){
            ws.close()
        }
    }
}