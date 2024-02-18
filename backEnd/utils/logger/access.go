package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func accessLogger(conf string) (*zap.Logger, error) {
	config := zap.Config{
		Encoding: "json",
		Level:    zap.NewAtomicLevelAt(zap.InfoLevel),
		EncoderConfig: zapcore.EncoderConfig{
			TimeKey:       "time",
			LevelKey:      "level",
			NameKey:       "logger",
			CallerKey:     "caller",
			MessageKey:    "msg",
			StacktraceKey: "stacktrace",
			LineEnding:    zapcore.DefaultLineEnding,
			EncodeLevel:   zapcore.LowercaseLevelEncoder,
		},
		OutputPaths:      []string{"stdout", "test.log"},
		ErrorOutputPaths: []string{"error.log"},
	}
	return config.Build() // 返回一个Logger实例
}
