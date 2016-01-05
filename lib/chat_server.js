var socketio = require("socket.io");
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};

exports.listen = function(server){
	io = socketio.listen(server);	//启动Socket.io服务器，允许它搭载在已有的HTTP服务器上
	io.set("log level",1);

	io.sockets.on("connction",function(socket){	//定义每个用户连接的处理逻辑
		//在用户连接上来时赋予其一个访客名
		guestNumber  = assignGuestName(socket,guestNumber,nickNames,namesUsed);

		joinRoom(socket,"Lobby");	//	在用户连接上时把他放在聊天室Lobby

		//处理用户的消息，更名，以及聊天室的创建于变更
		handleMessageBroadcasting(socket,nickNames);
		handleNameChangeAttempts(socket,nickNames,namesUsed);
		handleRoomJoining(sockets);

		//用户发出请求时，向其提供已经被占用的聊天室列表
		socket.on("room",function(){
			socket.emit("rooms",io.sockets.manager.rooms);
		});

		//定义用户断开连接后的清除逻辑
		handleClientDisconnection(socket,nickNames,namesUsed);

	});
};

//分配昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
	var name = "Guest" + guestNumber;
	//把用户的昵称与客户端连接ID关联
	nickNames[socket.id] = name;

	//让用户知道他们的昵称
	socket.emit("nameResult",{
		success:true,
		name:name
	});
	namesUsed.push(name);	//存放已经占用的昵称
	return guestNumber + 1;
}

//进入聊天室
function joinRoom(socket,room){
	//让用户进入房间
	socket.join(room);

	//记录用户的当前房间
	currentRoom[socket.id] = room;

	//让用户知道他们进入的房间
	socket.emit("joinResult",{room:room});

	//让房间的其他用户知道有新用户进入房间
	socket.broadcast.to(room).emit("massage",{
		text:nickNames[socket.id] + "has joined" + room + "."
	});

	//确认有哪些用户在房间里
	var usersInRoom = io.sockets.clients(room);
	//如果不止一个用户，汇总下都是谁
	if(usersInRoom.length > 1){
		var usersInRoomSummary = "Users currently in" + room + ":";
		for(var index in usersInRoom){
			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id){
				if(index > 0){
					usersInRoomSummary += ", ";
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += ".";

		//将房间里的其他用户汇总发给这个用户
		socket.emit("message",{text:usersInRoomSummary});	
	}

}

//更名请求
function handleNameChangeAttempts(socket,nickNames,namesUsed){
	//添加nameAttempt事件监听器
	socket.on("nameAttempt",function(name){
		if(name.indexOf("Guest") == 0){	//昵称不能以Guest开头
			socket.emit("nameResult",{
				success:false,
				message:'Name is cannot begin with "Guest".'
			});	
		}else{
			if(namesUsed.indexOf("Guest") == -1){	//如果昵称没有注册则注册
				var previousName = nickNames[sicket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);

				//删掉之前的昵称，让其他用户可以使用
				delete namesUsed[previousNameIndex];
				socket.emit("nameResult",{
					success:true,
					nme:name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit("message",{
					text: previousName + "is now known as " + name + "."
				});
			}else{
				//如果昵称已经被占用，给客户端发送错误消息
				socket.emit("nameResult",{
					success:false,
					message:"That name is already in use."
				});
			}
		}
	});
}

//发送聊天消息
function handleMessageBroadcasting(socket){
	socket.on("message",function(message){
		socket.broadcast.to(message.room).emit("message",{
			text: nickNames[socket.id] + ":" + message.text
		});
	});
}

//创建房间
function handleRoomJoining(socket){
	socket.on("join",function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	});
}

//用户断开连接
function handleClientDisconnection(socket){
	socket.on("disconnect",function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}