package api

import (
	"backEnd/algorithm"
	"backEnd/utils/logger"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

var ws = websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024}

func WsHandler(c *gin.Context) {
	upgrade, err := ws.Upgrade(c.Writer, c.Request, nil)
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

		//TODO 解析前端传递的协议
		err = json.Unmarshal(p, &algorithm.ArrayObjects{})
		if err != nil {
			logger.Business.Error("websocket connection read failed", zap.Error(err))
			return
		}

		//TODO 开启协程和管道处理数据并主动推送到前端

		err = upgrade.WriteMessage(messageType, p)
		if err != nil {
			logger.Business.Error("websocket connection write failed", zap.Error(err))
			return
		}
	}
}

func TestHandler(c *gin.Context) {
	upgrade, err := ws.Upgrade(c.Writer, c.Request, nil)
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
