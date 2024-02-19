package router

import (
	"backEnd/api"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

// 这里定义路由
func Router(c *gin.Engine) {

	c.Group("/ws")
	{
		c.GET("/test", api.TestHandler)
		c.GET("/track", api.WsHandler)
	}

	port := viper.GetString("server.port")

	c.Run(":" + port)
}
