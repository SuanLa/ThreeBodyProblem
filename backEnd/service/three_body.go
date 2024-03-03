package service

import (
	"backEnd/utils/algorithm"
)

func Control(objects *algorithm.ArrayObjects) []byte {
	//TODO 调用算法模块

	for _, val := range objects.GetObjects() {
		go {
			val.Update()
		}
	}
	return nil
}
