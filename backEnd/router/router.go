package router

import (
	"backEnd/api"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

// 这里定义路由
func Router(c *gin.Engine) {

	v1 := c.Group("/v1")
	{
		v1.GET("/test", api.TestHandler)
		v1.GET("/track", api.WsHandler)
	}

	port := viper.GetString("server.port")

	c.Run(":" + port)
}
