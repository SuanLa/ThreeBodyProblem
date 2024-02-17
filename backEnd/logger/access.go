package logger

import "go.uber.org/zap"

func accessLogger() (*zap.Logger, error) {
	config := zap.Config{
		Encoding:         "json",
		Level:            zap.NewAtomicLevelAt(zap.InfoLevel),
		OutputPaths:      []string{"stdout"},
		ErrorOutputPaths: []string{"stderr"},
		EncoderConfig:    zap.NewProductionEncoderConfig(),
		InitialFields:    map[string]interface{}{"serviceName": "biz-service"},
	}
	return config.Build() // 返回一个Logger实例
}
