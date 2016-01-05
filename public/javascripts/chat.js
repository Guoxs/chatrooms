var Chat = function(socket){
	this.socket = socket;
};

//发送消息函数
Chat.prototype.sendMessage = function(room,text){
	var message = {
		room:room,
		text:text
	};
	this.socket.emit("message",message);
};

//变更房间函数
Chat.prototype.changeRoom = function(room){
	this.socket.emit("join",{
		newRoom:room
	});
};

//处理聊天命令
Chat.prototype.processCommand = function(command){
	var words = command.split(' ');

	//从第一个单词开始解析命令
	var command = words[0].substring(1,words[0].length).toLowerCase();

	var message = false;

	switch(command){
		case "join":
		words.shift();
		var room = words.join(" ");
		this.changeRoom(room);
		break;

		case "nick":
		words.shift();
		var name = words.join(" ");
		this.socket.emit("nameAttempt",name);
		break;

		default:
		message = "Unrecongnized command.";
		break;
	}
	return message;                                                                                                                                                                  
};

//净化显示文本
function divEscapedContentElement(message){
	return $("<div></div>").text(message);
}
function divSystemContentElement(message){
	return $("<div></div>").html("<i>" + message + "</i>");
}