class sdtdChat {
  constructor(serverId) {
    this.serverId = serverId;
  }

  start() {
    console.log('Starting chat for server with id ' + this.serverId);

    io.socket.get('/sdtdserver/' + this.serverId + '/socket', function (response) {
      console.log('Subscribed to socket ' + response);
    });
    io.socket.on('chatMessage', function addNewChatMessage(chatMessage) {

      if (chatMessage.playerName == 'Server') {
        $('.chat-window').append(`<li class=\"chat-message\">${chatMessage.messageText} </li>`);

      } else {
        $('.chat-window').append(`<li class=\"chat-message\">${chatMessage.playerName}: ${chatMessage.messageText} </li>`);
      }
      $('.chat-window').scrollTop($('.chat-window')[0].scrollHeight);
    });
  }

  stop() {
    io.socket.removeListener('chatMessage', addNewChatMessage);
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/sdtdserver/sendMessage`,
        data: {
          serverId: this.serverId,
          message: message
        },
        success: (data, status, xhr) => {
          resolve(data);
        },
        error: (xhr, status, error) => {
          $('.chat-window').append('<li class=\"chat-message text-danger\">' + error + '</li>');
          resolve(error);
        }
      });
    });
  }
}
