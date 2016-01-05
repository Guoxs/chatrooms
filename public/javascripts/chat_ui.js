//处理原始的用户输入
function processUserInput(chatApp,socket){
	var message = $("#send-message").val();
	var systemMessage;

	//如果用户输入内容以斜杠开头则视为命令
	if(message.chatAt(0) == "/"){
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			$("#messages").append(divSystemContentElement(systemMessage));
		}
	}else{
		chatApp.sendMessage($("#room").text(),message);
		$("#messages").append(divEscapedContentElement(systemMessage));
		$("#messages").scrollTop($("#messages").prop("scrollHeight"));
	}
	$("#send-message").val("");
}

//客户端程序初始化逻辑
var socket = io.connect();

$(document).ready(function(){
	var chatApp = new Chat(socket);

	socket.on("nameResult",function(result){
		//显示更名尝试的结果
		var message;

		if(result.success){
			message = "You are now known as" + result.name + ".";
		}else{
			message = result.message;
		}
		$("#messages").append(divSystemContentElement(message));
	});

	//显示房间变更结果
	socket.on("joinResult",function(result){
		$("#room").text(result.room);
		$("#messages").append(divSystemContentElement("Room changed"));
	});

	//显示接收到的消息
	socket.on("message",function(message){
		var newElement = $("<div></div>").text(message.text);
		$("#messages").append(newElement);
	});

	//显示可用的房间列表
	socket.on("rooms",function(rooms){
		$("#room-list").empty();

		for(var room in rooms){
			room = room.substring(1,room.length);
			if(room != ""){
				$("#room-list").append(divEscapedContentElement(room));
			}
		}

		//点击房间名可以换到相应房间
		$("#room-list div").click(function(){
			chatApp.processCommand("/join" + $(this).text());
			$("#send-message").focus();
		});
	});

	//定期请求可用房间列表
	setInterval(function(){
		socket.emit("room");
	},1000);

	$("#send-message").focus();

	//提交表单可以发送聊天信息
	$("#send-form").submit(function(){
		processUserInput(chatApp,socket);
		return false;
	});

});