var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var cache = {};

function send404(response){
	response.writeHead(404,{"Content-Type":"text/plain"});
	response.write("Error 404: resourse not found.");
	response.end();
}

function sendFile(response,filePath,fileContents){
	response.writeHead(200,{"content-type":mime.lookup(path.basename(filePath))});
	response.end(fileContents);
}

function serverStatic(response,cache,absPath){
	if(cache[absPath]){	//检查文件是否缓存在内存中
		sendFile(response,absPath,cache[absPath]);	//从内存中返回文件
	}else{
		fs.exists(absPath,function(exists){	//检查文件是否存在
			if(exists){
				fs.readFile(absPath,function(err,data){	//从硬盘读取文件
					if(err){
						send404(response);
					}else{
						cache[absPath] = data;
						sendFile(response,absPath,data);	//从硬盘读取文件并返回
					}
				});
			}else{
				send404(response);
			}
		});
	}
}

var server = http.createServer(function(request,responese){
	var filePath = false;

	if(request.url == "/"){
		filePath = "public/index.html";
	}else{
		filePath = "public" + request.url;	//将URL转化为文件的相对路径
	}
	var absPath = "./" + filePath;
	serverStatic(response,cache,absPath);
});

server.listen(3000,function(){
	console.log("Server listening on port 3000.");
});

var chatServer = require("./lib/chat_server");
chatServer.listen(server);