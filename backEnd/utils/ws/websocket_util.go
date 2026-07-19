package ws

import (
	"backEnd/service"
	"backEnd/utils/algorithm"
	"backEnd/utils/logger"
	"backEnd/utils/protocol"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// websocket跨域
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Session 表示一条 websocket 连接及其独立的仿真状态。
// 每个连接各自持有一份，互不共享，支持多客户端并发
type Session struct {
	conn  *websocket.Conn
	msgCh chan *protocol.Protocol
}

// Handle 升级连接并运行仿真会话，连接关闭后返回
func Handle(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Business.Error("websocket upgrade failed", zap.Error(err))
		return
	}

	s := &Session{
		conn:  conn,
		msgCh: make(chan *protocol.Protocol, 16),
	}

	go s.readLoop()
	s.runLoop()

	// 关闭连接使 readLoop 退出，并排空余量消息，避免 goroutine 泄漏
	_ = conn.Close()
	for range s.msgCh {
	}
	logger.Business.Info("websocket session closed", zap.String("remote", conn.RemoteAddr().String()))
}

// readLoop 持续读取客户端协议消息，连接关闭或读错误时关闭 msgCh 退出
func (s *Session) readLoop() {
	defer close(s.msgCh)
	for {
		_, data, err := s.conn.ReadMessage()
		if err != nil {
			return
		}

		var p protocol.Protocol
		if err := json.Unmarshal(data, &p); err != nil {
			logger.Business.Error("protocol unmarshal failed", zap.Error(err), zap.ByteString("payload", data))
			continue
		}
		s.msgCh <- &p
	}
}

// runLoop 按协议推进仿真并推送结果，收到停止指令或连接断开时返回
func (s *Session) runLoop() {
	// 等待首条协议
	proto, ok := <-s.msgCh
	if !ok || !proto.Star {
		return
	}

	sys, err := service.NewSystem(proto)
	if err != nil {
		logger.Business.Error("system init failed", zap.Error(err))
		return
	}
	twin, err := service.NewTwinSystem(proto)
	if err != nil {
		logger.Business.Error("twin system init failed", zap.Error(err))
		return
	}
	logger.Business.Info("simulation started",
		zap.String("integrator", sys.Integrator.Name()),
		zap.Float64("g", sys.G),
		zap.Float64("dt", sys.Dt),
		zap.Int("objects", len(sys.Objects)),
		zap.Bool("twin", twin != nil))

	stepsPerPush := normalizeSteps(proto.StepsPerPush)
	paused := false

	ticker := time.NewTicker(pushInterval(proto.SleepTime))
	defer ticker.Stop()

	for {
		select {
		case p, ok := <-s.msgCh:
			if !ok || !p.Star {
				logger.Business.Info("simulation stopped by client")
				return
			}

			switch p.Cmd {
			case "pause":
				paused = true

			case "resume":
				paused = false

			case "step":
				// 单步：进入暂停态并精确推进一步
				paused = true
				if err := s.advanceAndPush(sys, twin, proto, 1); err != nil {
					return
				}

			case "speed":
				// 只调整播放速度，不动仿真状态
				if p.SleepTime > 0 {
					proto.SleepTime = p.SleepTime
					ticker.Reset(pushInterval(p.SleepTime))
				}
				stepsPerPush = normalizeSteps(p.StepsPerPush)

			default:
				// 全量启动/更新：重建仿真系统（兼容旧版协议）
				newSys, err := service.NewSystem(p)
				if err != nil {
					logger.Business.Error("system update failed", zap.Error(err))
					return
				}
				newTwin, err := service.NewTwinSystem(p)
				if err != nil {
					logger.Business.Error("twin system update failed", zap.Error(err))
					return
				}
				sys = newSys
				twin = newTwin
				proto = p
				stepsPerPush = normalizeSteps(p.StepsPerPush)
				ticker.Reset(pushInterval(p.SleepTime))
				paused = false
			}

		case <-ticker.C:
			if paused {
				continue
			}
			if err := s.advanceAndPush(sys, twin, proto, stepsPerPush); err != nil {
				return
			}
		}
	}
}

// advanceAndPush 将主系统与孪生系统（若有）同步推进 steps 个时间步后推送一帧
func (s *Session) advanceAndPush(sys, twin *algorithm.System, proto *protocol.Protocol, steps int64) error {
	for i := int64(0); i < steps; i++ {
		sys.Step()
		if twin != nil {
			twin.Step()
		}
	}

	proto.Timestamp = time.Now().Unix()
	proto.Objects = &algorithm.ArrayObjects{Objects: sys.Objects}
	if twin != nil {
		proto.TwinObjects = &algorithm.ArrayObjects{Objects: twin.Objects}
	} else {
		proto.TwinObjects = nil
	}

	data, err := json.Marshal(proto)
	if err != nil {
		logger.Business.Error("protocol marshal failed", zap.Error(err))
		return err
	}
	if err := s.conn.WriteMessage(websocket.TextMessage, data); err != nil {
		logger.Business.Error("websocket write failed", zap.Error(err))
		return err
	}
	return nil
}

// normalizeSteps 约束每帧推进步数在 [1, 64]
func normalizeSteps(n int64) int64 {
	if n <= 0 {
		return 1
	}
	if n > 64 {
		return 64
	}
	return n
}

// pushInterval 把协议中的 SleepTime（单位 10 毫秒）换算为推送间隔
func pushInterval(sleepTime int64) time.Duration {
	d := time.Duration(sleepTime) * 10 * time.Millisecond
	if d <= 0 {
		d = 10 * time.Millisecond
	}
	return d
}
