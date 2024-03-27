package middleware

import (
	"backEnd/utils/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"time"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 设置请求开始时间
		start := time.Now()
		logger.Access.Info("Request received", zap.String("request method", c.Request.Method), zap.String("request URI", c.Request.RequestURI))
		// 继续处理请求
		c.Next()
		// 设置请求完成时间
		cost := time.Since(start)
		// 打印请求耗时
		logger.Access.Info("Request completed", zap.String("request method", c.Request.Method), zap.String("request URI", c.Request.RequestURI), zap.Any("response status", c.Writer.Status()), zap.Duration("cost", cost))
	}
}
