package protocol

import (
	"backEnd/utils/algorithm"
)

type Protocol struct {
	Star      bool                    `json:"star"`      //协议控制，false 表示停止仿真
	Timestamp int64                   `json:"timestamp"` //协议时间戳
	Objects   *algorithm.ArrayObjects `json:"Objects"`   //协议数据
	SleepTime int64                   `json:"SleepTime"` //推送间隔，单位 10 毫秒

	// 以下为可选仿真参数，零值时后端取默认值，旧版前端无需修改
	G         float64 `json:"G,omitempty"`         //引力常数
	Dt        float64 `json:"Dt,omitempty"`        //积分时间步长
	Method    string  `json:"Method,omitempty"`    //积分器：euler | verlet | rk4
	Softening float64 `json:"Softening,omitempty"` //引力软化项

	// 播放控制指令。空表示全量启动/更新仿真（兼容旧版协议）
	Cmd          string `json:"Cmd,omitempty"`          //pause | resume | step | speed
	StepsPerPush int64  `json:"StepsPerPush,omitempty"` //每次推送前推进的步数，用于倍速播放

	// 混沌敏感性对比：微扰初值的孪生系统，与主系统各自独立演化、同步推进
	TwinObjects *algorithm.ArrayObjects `json:"TwinObjects,omitempty"`
}
