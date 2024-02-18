package middleware

import (
	"backEnd/utils"
	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {

				// 可以根据需要进行日志记录或错误处理
				// 然后将错误返回给客户端
				utils.Panic(c, "系统错误，请稍后再试", nil)
			}
		}()

		c.Next()
	}
}
