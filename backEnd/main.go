package main

import (
	"backEnd/algorithm"
	"backEnd/middleware"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
)

var ws = websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024}

func main() {
	engine := gin.New()

	engine.Use(middleware.Recovery())

	engine.GET("/ws", wsHandler)

	log.Println("Server started on 6750")
	log.Fatal(engine.Run())
	engine.Run(":6750")
}

func wsHandler(c *gin.Context) {
	upgrade, err := ws.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}

	defer func(upgrade *websocket.Conn) {
		err := upgrade.Close()
		if err != nil {
			log.Println(err)
		}
	}(upgrade)

	for {
		messageType, p, err := upgrade.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		log.Println(string(p))
		err = json.Unmarshal(p, &algorithm.ArrayObjects{})
		if err != nil {
			return
		}

		//TODO 开启协程和管道处理数据并主动推送到前端

		err = upgrade.WriteMessage(messageType, p)
		if err != nil {
			log.Println(err)
			return
		}
	}
}
