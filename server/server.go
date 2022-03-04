package server

import (
	"log"
	"net/http"
)

func RunServer() {
	publicDirFileServer := http.FileServer(http.Dir("./dist"))
	publicDirFileServer := http.FileServer(http.Dir("./dist"))
	http.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		http.ServeFile(res, req, "./public/index.html")
	})
	http.Handle("/static", publicDirFileServer)
	log.Fatal(http.ListenAndServe(":9000", nil))
}
