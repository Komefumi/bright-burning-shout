package main

import (
	"flag"
	"sync"

	"github.com/Komefumi/bright-burning-shout/config"
	"github.com/Komefumi/bright-burning-shout/ui"
)

func main() {
	wg := sync.WaitGroup{}
	wg.Add(1)
	var mode string

	flag.StringVar(&mode, "mode", "development", "Specify the mode to run. Default is development")

	if mode == config.ProductionMode {
		ui.RunAll(config.ProductionMode)
		wg.Wait()
	} else {
		ui.RunAll(config.DevelopmentMode)
		wg.Wait()
	}
}
