package protocol

import (
	"backEnd/utils/algorithm"
	"time"
)

type Protocol struct {
	star      bool                    //协议控制
	timestamp time.Duration           //协议时间戳
	objects   *algorithm.ArrayObjects //协议数据
}

func (p *Protocol) GetStar() bool {
	return p.star
}

func (p *Protocol) GetTimestamp() time.Duration {
	return p.timestamp
}

func (p *Protocol) GetObjects() *algorithm.ArrayObjects {
	return p.objects
}
