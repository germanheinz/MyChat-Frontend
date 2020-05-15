import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Message } from '../model/message';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;
  connected: Boolean = false;
  message: Message = new Message();
  messages: Message[] = [];

  constructor() { }

  ngOnInit() {
    this.client = new Client();
    this.client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/chat-websocket");
    }
    this.client.onConnect = (frame) => {
      console.log('Connected: ' + this.client.connected + ' : ' + frame);
      this.connected = true;

      this.client.subscribe('/chat/message', e => {
        let message: Message = JSON.parse(e.body) as Message;
        this.messages.push(message);
        console.log(message);
      });
    };

    this.client.onDisconnect = (frame) => {
      console.log('Disconnected: ' + !this.client.connected + ' : ' + frame);
      this.connected = false;
    };
  }
  connect(){
    this.client.activate();
    this.connected = true;
  }

  disconnect(){
    this.client.deactivate();
    this.connected = false;
  }

  sendMessage(): void{
    console.log(this.message);
    this.client.publish({destination:'/app/message', body: JSON.stringify(this.message)});
    this.message.text = '';
  }


}
