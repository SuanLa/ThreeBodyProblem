package service

import (
	"backEnd/utils/algorithm"
)

func Control(objects *algorithm.ArrayObjects) []byte {
	for _, val := range objects.GetObjects() {
		go val.Update()
	}
	return nil
}
