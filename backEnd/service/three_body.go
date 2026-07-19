package service

import (
	"backEnd/utils/algorithm"
	"backEnd/utils/protocol"
	"errors"
)

const (
	// DefaultG 与前端设置页使用的引力常数保持一致
	DefaultG = 6.67e-8
	// DefaultDt 与旧版每步一秒的行为保持一致
	DefaultDt = 1.0
)

// buildSystem 用协议中的仿真参数为给定物体构造系统
func buildSystem(objects []algorithm.Object, p *protocol.Protocol) (*algorithm.System, error) {
	g := p.G
	if g == 0 {
		g = DefaultG
	}

	dt := p.Dt
	if dt == 0 {
		dt = DefaultDt
	}

	integrator, err := algorithm.NewIntegrator(p.Method)
	if err != nil {
		return nil, err
	}

	return &algorithm.System{
		Objects:    objects,
		G:          g,
		Dt:         dt,
		Softening:  p.Softening,
		Integrator: integrator,
	}, nil
}

// NewSystem 根据协议构造仿真系统，未指定的可选参数取默认值
func NewSystem(p *protocol.Protocol) (*algorithm.System, error) {
	if p.Objects == nil || len(p.Objects.Objects) == 0 {
		return nil, errors.New("protocol carries no objects")
	}
	return buildSystem(p.Objects.Objects, p)
}

// NewTwinSystem 构造混沌对比用的孪生系统；协议未携带孪生初值时返回 nil
func NewTwinSystem(p *protocol.Protocol) (*algorithm.System, error) {
	if p.TwinObjects == nil || len(p.TwinObjects.Objects) == 0 {
		return nil, nil
	}
	return buildSystem(p.TwinObjects.Objects, p)
}
