import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
  isWriting: String;
  changeDetectorRef: ChangeDetectorRef;

  @ViewChild('scrollChat') comment: ElementRef ;
  scrolltop: number = null;

  userId: string;

  constructor() {
    this.userId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2);
  }

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
        message.date = new Date(message.date);
        // this.message.username = message.username;

        if(this.message.color && message.type == 'NEW_USER' &&
          this.message.username == message.username){
  
            this.message.color = message.color;

          }
        this.messages.push(message);
        this.scrolltop = this.comment.nativeElement.scrollHeight;
        console.log(message);
      });

      this.client.subscribe('/chat/writing', e => {
        this.isWriting = e.body;
        setTimeout(() => this.isWriting = '', 3000);
      });

      // GET HISTORY OF USER CHAT
      this.client.subscribe('/chat/history/' + this.userId, e => {
        let history = JSON.parse(e.body) as Message[];
        this.messages = history.map(m => {
          m.date = new Date(m.date);
          return m;
        }).reverse();
      });
      // NOTIFY TO BROKER,GET MESSAGE
      this.client.publish({destination: '/app/history', body: this.userId});

      this.message.type = 'NEW_USER';
      this.client.publish({destination: '/app/message', body: JSON.stringify(this.message)});
    
    };

    this.client.onDisconnect = (frame) => {
      console.log('Disconnected: ' + !this.client.connected + ' : ' + frame);
      this.connected = false;
      this.message = new Message();
      this.messages = [];
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
    this.message.type = 'NEW_MESSAGE';
    this.client.publish({destination:'/app/message', body: JSON.stringify(this.message)});
    this.message.text = '';
  
  }
  writing(): void{
    this.client.publish({destination:'/app/writing', body: this.message.username});
  }

}
