package protocol

import (
	"backEnd/utils/algorithm"
)

type Protocol struct {
	Star      bool                    `json:"star"`      //协议控制
	Timestamp int64                   `json:"timestamp"` //协议时间戳
	Objects   *algorithm.ArrayObjects `json:"Objects"`   //协议数据
}
