package middleware

import (
	"backEnd/utils/logger"
	"backEnd/utils/result"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Access.Panic("Recovery from panic", zap.Any("error", err))
				// 可以根据需要进行日志记录或错误处理
				// 然后将错误返回给客户端
				result.Panic(c, "系统错误，请稍后再试", nil)
			}
		}()

		c.Next()
	}
}
