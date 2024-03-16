package algorithm

import (
	"backEnd/utils/logger"
	"go.uber.org/zap"
	"math"
	"strconv"
)

const GravitationalConstant = "6.67e-11"

type ArrayObjects struct {
	Objects []Object `json:"objects"`
}

func (ao ArrayObjects) Run() (ArrayObjects, error) {
	for index, _ := range ao.Objects {
		go running(index, ao)
	}

	return ao, nil
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

			res := float64(obj.Quality * object.Quality)

			// 计算并分解力
			f := gc * res / d
			fx := f * float64(object.Position.X-obj.Position.X) / d
			fy := f * float64(object.Position.Y-obj.Position.Y) / d
			fz := f * float64(object.Position.Z-obj.Position.Z) / d

			q := float64(obj.Quality)
			// 加速度
			ax := fx / q
			ay := fy / q
			az := fz / q

			// 速度
			vx := ax * 1
			vy := ay * 1
			vz := az * 1

			// 更新位置
			obj.Update(int64(vx), int64(vy), int64(vz))
		}
	}

	return obj, index, nil
}

// 计算物体距离的方法
func distance(obj1, obj2 Object) float64 {
	dx := (obj2.Position.X - obj1.Position.X) * (obj2.Position.X - obj1.Position.X)
	dy := (obj2.Position.Y - obj1.Position.Y) * (obj2.Position.Y - obj1.Position.Y)
	dz := (obj2.Position.Z - obj1.Position.Z) * (obj2.Position.Z - obj1.Position.Z)

	return math.Sqrt(float64(dx + dy + dz))
}
