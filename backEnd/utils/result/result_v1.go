package result

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

const (
	ERROR   = 0 // 错误
	SUCCESS = 1 // 成功
)

type result struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// 错误返回
func Fail(c *gin.Context, msg string, data interface{}) {
	c.JSON(http.StatusOK, result{
		Code: ERROR,
		Msg:  msg,
		Data: data,
	})
}

// 成功返回
func Success(c *gin.Context, msg string, data interface{}) {
	c.JSON(http.StatusOK, result{
		Code: SUCCESS,
		Msg:  msg,
		Data: data,
	})
}

// 服务器内部错误
func Panic(c *gin.Context, msg string, data interface{}) {
	c.JSON(http.StatusInternalServerError, result{
		Code: ERROR,
		Msg:  msg,
		Data: data,
	})
}
