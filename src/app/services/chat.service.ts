import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HubConnection } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { TypingOptions, UserRoom } from '../interfaces/user-room';
import { ToastrService } from 'ngx-toastr';
import { iMessage } from '../interfaces/message';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  public connection: HubConnection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:7166/chat')
    .configureLogging(signalR.LogLevel.Information)
    .build();

  public activeUserAndRoom$ = new BehaviorSubject<UserRoom | null>(null);
  public messages$ = new BehaviorSubject<any>([]);
  public connectedUsers$ = new BehaviorSubject<string[]>([]);
  public typingOptions$ = new BehaviorSubject<TypingOptions | null>(null);

  public messages: any[] = [];
  public users: string[] = [];

  constructor(private toastrService: ToastrService) {

    // this.connection.on('ReceiveMessage', (user: string, message: string, messageTime: string) => {
    //   this.messages = [...this.messages, { user, message, messageTime }]
    //   console.log(this.messages)
    //   this.messages$.next(this.messages)
    // })

    this.connection.on('ReceiveMessage', (message: iMessage) => {
      console.log(message)
      this.messages = [...this.messages, message]
      console.log(this.messages)
      this.messages$.next(this.messages)
    })

    this.connection.on('ConnectedUser', (users: any) => {
      this.connectedUsers$.next(users)
    })

    this.connection.on('NewUser', (message: string) => {
      this.toastrService.success(message)
    })

    this.connection.on('TypingTrue', (username: string) => {
      this.typingOptions$.next({ isTyping: true, username })
    })

    this.connection.on('TypingFalse', () => {
      this.typingOptions$.next({ isTyping: false, username: "" })
    })

    //on connected
    this.connection.on('OnConnected', (message: string) => {
      this.toastrService.warning(message)
    })

    //ping
    this.connection.on('Ping', () => {
      this.toastrService.warning("ping from server")
    })
  }

  // start connection
  public async start() {
    try {
      await this.connection.start();
    } catch (error) {
      console.log(error)
    }
  }

  public async newUser(user: string, room: string) {
    return this.connection.send("NotifyNewUser", { user, room })
  }

  public async joinRoom(user: string, room: string) {
    this.activeUserAndRoom$.next({ user, room })
    return this.connection.invoke('JoinRoom', { user, room })
  }

  public async sendMessage(message: iMessage) {
    return this.connection.invoke('SendMessage', message)
  }

  public async leaveChat() {
    return this.connection.stop();
  }

  public async setTypingTrue(user: string, room: string) {
    return this.connection.invoke('SetTypingTrue', { user, room })
  }

  public async setTypingFalse(user: string, room: string) {
    return this.connection.invoke('SetTypingFalse', { user, room })
  }
}
