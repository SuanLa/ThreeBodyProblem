package protocol

import (
	"backEnd/utils/algorithm"
	"time"
)

type Protocol struct {
	Star      bool                    `json:"star"`      //协议控制
	Timestamp time.Duration           `json:"timestamp"` //协议时间戳
	Objects   *algorithm.ArrayObjects `json:"Objects"`   //协议数据
}

func (p *Protocol) GetStar() bool {
	return p.Star
}

func (p *Protocol) GetTimestamp() time.Duration {
	return p.Timestamp
}

func (p *Protocol) GetObjects() *algorithm.ArrayObjects {
	return p.Objects
}
