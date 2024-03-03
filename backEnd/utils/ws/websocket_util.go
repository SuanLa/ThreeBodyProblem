package ws

import (
	"backEnd/service"
	"backEnd/utils/logger"
	"backEnd/utils/protocol"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

var (
	ws          = websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024}
	upgrade     *websocket.Conn
	messageType int
	p           []byte
	err         error
)

func New(c *gin.Context) {
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
}

func Rec(ch chan *protocol.Protocol) {
	for {
		messageType, p, err = upgrade.ReadMessage()
		if err != nil {
			logger.Business.Error("websocket connection read failed", zap.Error(err))
			return
		}

		logger.Business.Info("msg", zap.String("msg", string(p)))

		var ptc *protocol.Protocol
		// 解析前端传递的协议
		err = json.Unmarshal(p, &ptc)
		if err != nil {
			logger.Business.Error("websocket connection read failed", zap.Error(err))
			return
		}

		ch <- ptc

		if !ptc.GetStar() {
			logger.Business.Info("websocket connection close")
			err = upgrade.Close()
			return
		}
	}
}

func SendMsg(ch chan *protocol.Protocol) {
	// 定义数据存储对象
	var ptc *protocol.Protocol

	for {
		temp := <-ch

		if !temp.GetStar() {
			logger.Business.Info("websocket connection close")
			err := upgrade.Close()
			if err != nil {
				return
			}
			return
		}

		if temp != nil {
			ptc = temp
			logger.Business.Info("data update", zap.Any("old data", ptc), zap.Any("new data", temp))
		}

		//数据处理
		bytes := service.Control(ptc.GetObjects())

		//主动推送到前端
		err = upgrade.WriteMessage(messageType, bytes)
		if err != nil {
			logger.Business.Error("websocket connection write failed", zap.Error(err))
			return
		}
	}
}
