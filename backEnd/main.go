package main

import (
	"backEnd/middleware"
	"backEnd/router"
	"backEnd/utils/logger"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"log"
)

func starter() {
	viper.SetConfigType("yaml")
	viper.SetConfigFile("./config/application.yaml")
	err := viper.ReadInConfig()
	if err != nil {
		log.Fatal("Error reading configs fileGenerator, %s", err)
	}

	logger.NewAccess()
	logger.NewBusiness()
}

func main() {
	starter()

	engine := gin.New()

	engine.Use(middleware.Logger())
	engine.Use(middleware.Recovery())
	engine.Use(middleware.Auth())

	router.Router(engine)
}
