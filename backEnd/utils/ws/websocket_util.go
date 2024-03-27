package ws

import (
	"backEnd/service"
	"backEnd/utils/logger"
	"backEnd/utils/protocol"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"net/http"
	"time"
)

var (
	ws = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		// websocket跨域
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	upgrade     *websocket.Conn
	messageType int
	p           []byte
	wsErr       error
)

func New(c *gin.Context) {
	upgrade, wsErr = ws.Upgrade(c.Writer, c.Request, nil)
	if wsErr != nil {
		logger.Business.Error("websocket connection failed", zap.Error(wsErr))
		return
	}
	//
	//defer func(upgrade *websocket.Conn) {
	//	err := upgrade.Close()
	//	if err != nil {
	//		logger.Business.Error("websocket connection close failed", zap.Error(err))
	//		return
	//	}
	//}(upgrade)
}

func Rec(ch chan *protocol.Protocol, st chan bool) {
	for {
		messageType, p, wsErr = upgrade.ReadMessage()
		if wsErr != nil {
			logger.Business.Error("websocket connection read failed", zap.Error(wsErr))
			return
		}

		logger.Business.Info("msg", zap.String("receive message", string(p)))

		var ptc *protocol.Protocol
		// 解析前端传递的协议
		err := json.Unmarshal(p, &ptc)
		if err != nil {
			logger.Business.Error("websocket connection read failed", zap.Error(err))
			return
		}

		ch <- ptc

		if !ptc.Star {
			logger.Business.Info("websocket connection close")
			err = upgrade.Close()
			st <- true
			return
		}
	}
}

func SendMsg(ch chan *protocol.Protocol) {
	// 定义数据存储对象
	var ptc *protocol.Protocol

	for {
		select {
		case temp := <-ch:
			if !temp.Star {
				err := upgrade.Close()
				if err != nil {
					logger.Business.Error("websocket connection close failed", zap.Error(err))
					return
				}

				logger.Business.Info("websocket connection close")
				return
			}

			if temp != nil {
				ptc = temp
				logger.Business.Info("receive data update", zap.Any("old data", ptc), zap.Any("new data", temp))
			}

			//数据处理
			ao, err := service.Control(ptc.Objects)
			if err != nil {
				logger.Business.Error("data process failed", zap.Error(err))
				return
			}

			ptc.Timestamp = time.Now().Unix()
			ptc.Objects = &ao

			bytes, err := json.Marshal(ptc)
			if err != nil {
				logger.Business.Error("data marshal failed", zap.Error(err))
				return
			}

			logger.Business.Info("data send", zap.Any("data", ptc))

			//主动推送到前端
			err = upgrade.WriteMessage(messageType, bytes)
			if err != nil {
				logger.Business.Error("websocket connection write failed", zap.Error(err))
				return
			}

		default:
			if ptc != nil {
				//数据处理
				ao, err := service.Control(ptc.Objects)
				if err != nil {
					logger.Business.Error("data process failed", zap.Error(err))
					return
				}

				ptc.Timestamp = time.Now().Unix()
				ptc.Objects = &ao

				bytes, err := json.Marshal(ptc)
				if err != nil {
					logger.Business.Error("data marshal failed", zap.Error(err))
					return
				}

				logger.Business.Info("data send", zap.Any("data", ptc))

				//主动推送到前端
				err = upgrade.WriteMessage(messageType, bytes)
				if err != nil {
					logger.Business.Error("websocket connection write failed", zap.Error(err))
					return
				}
			}
		}

		// 休眠
		time.Sleep(time.Duration(30 * ptc.SleepTime))
	}
}
