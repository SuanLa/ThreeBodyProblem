package algorithm

import (
	"backEnd/utils/logger"
	"go.uber.org/zap"
	"math"
	"strconv"
)

const (
	GravitationalConstant = "6.67e-8"
	Time                  = 1
)

type ArrayObjects struct {
	Objects []Object `json:"objects"`
}

func (ao ArrayObjects) Run() (ArrayObjects, error) {
	newObjectArray := ArrayObjects{
		Objects: make([]Object, len(ao.Objects)),
	}

	for index, _ := range ao.Objects {
		object, i, err := running(index, ao)
		if err != nil {
			logger.Business.Error("object running failed", zap.Any("ObjectArray", ao), zap.Any("index", index), zap.Any("object", object), zap.Error(err))
			return ao, err
		}
		newObjectArray.Objects[i] = object
	}

	return newObjectArray, nil
}

func (ao *ArrayObjects) GetObjects() []Object {
	return ao.Objects
}

// 添加物体到数组的方法
func (ao *ArrayObjects) Add(obj Object) {
	ao.Objects = append(ao.Objects, obj)
}

// 移除物体的方法
func (ao *ArrayObjects) Remove(index int) {
	length := len(ao.Objects)
	array := make([]Object, length-1)
	for i, o := range ao.Objects {
		if i != index {
			array = append(array, o)
		}
	}

	ao.Objects = array
}

// 单个物体运行一秒
func running(index int, ao ArrayObjects) (Object, int, error) {
	obj := ao.Objects[index]
	for i, object := range ao.Objects {
		if i != index {
			d := distance(obj, object)

			gc, err := strconv.ParseFloat(GravitationalConstant, 64)
			if err != nil {
				logger.Business.Error("GravitationalConstant transform failed", zap.Any("Object", obj), zap.Any("index", index), zap.Error(err))
				return obj, index, err
			}

			// 质量之积
			messSum := float64(obj.Mess * object.Mess)

			// 计算并分解力
			f := gc * messSum / (d * d)
			fx := f * (object.Position.X - obj.Position.X) / d
			fy := f * (object.Position.Y - obj.Position.Y) / d
			fz := f * (object.Position.Z - obj.Position.Z) / d

			m := float64(obj.Mess)

			// 加速度
			ax := fx / m
			ay := fy / m
			az := fz / m

			// 更新位置和速度
			obj = obj.Update(ax, ay, az)
		}
	}

	// 更新时间
	obj.Time++

	return obj, index, nil
}

// 计算物体距离的方法
func distance(obj1, obj2 Object) float64 {
	dx := (obj2.Position.X - obj1.Position.X) * (obj2.Position.X - obj1.Position.X)
	dy := (obj2.Position.Y - obj1.Position.Y) * (obj2.Position.Y - obj1.Position.Y)
	dz := (obj2.Position.Z - obj1.Position.Z) * (obj2.Position.Z - obj1.Position.Z)

	return math.Sqrt(dx + dy + dz)
}
