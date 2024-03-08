package api

import (
	"backEnd/utils/logger"
	"backEnd/utils/protocol"
	"backEnd/utils/ws"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"net/http"
)

func WsHandler(c *gin.Context) {
	ws.New(c)
	ch := make(chan *protocol.Protocol)
	go ws.Rec(ch)
	go ws.SendMsg(ch)
}

func TestHandler(c *gin.Context) {
	wst := websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024, CheckOrigin: func(r *http.Request) bool {
		return true
	},
	}
	upgrade, err := wst.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Business.Error("websocket connection failed", zap.Error(err))
		return
	}

	defer func(upgrade *websocket.Conn) {
		err := upgrade.Close()
		if err != nil {
			logger.Business.Error("websocket connection close failed", zap.Error(err))
			return
		}
	}(upgrade)

	for {
		messageType, p, err := upgrade.ReadMessage()
		if err != nil {
			logger.Business.Error("websocket connection read failed", zap.Error(err))
			return
		}

		logger.Business.Info("msg", zap.String("msg", string(p)))

		if string(p) == "ping" {
			err = upgrade.WriteMessage(messageType, []byte("pong"))
		} else {
			err = upgrade.WriteMessage(messageType, []byte("err"))
		}

		if err != nil {
			logger.Business.Error("websocket connection write failed", zap.Error(err))
			return
		}
	}
}
