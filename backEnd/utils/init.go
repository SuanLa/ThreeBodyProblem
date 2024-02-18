package utils

import (
	"github.com/spf13/viper"
	"log"
)

func Starter() {
	viper.SetConfigName("./../configs/application.yaml")
	err := viper.ReadInConfig()
	if err != nil {
		log.Fatal("Error reading configs file, %s", err)
	}
}
