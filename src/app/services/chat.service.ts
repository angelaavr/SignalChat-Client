import {  Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HubConnection } from '@microsoft/signalr';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { TypingOptions, UserRoom } from '../interfaces/user-room';
import { ToastrService } from 'ngx-toastr';
import { iMessage } from '../interfaces/message';
import { ChatComponent } from '../components/chat/chat.component';

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

  countdownIntervals: { [key: string]: Subscription } = {};

  public messages: any[] = [];
  public users: string[] = [];


  private visibleMessages = new BehaviorSubject<Set<string>>(new Set());
  visibleMessages$ = this.visibleMessages.asObservable();

  private time = new BehaviorSubject<number>(0);
  time$ = this.time.asObservable();

  private remainingPercentage = new BehaviorSubject<number>(0);
  remainingPercentage$ = this.time.asObservable();

  constructor(private toastrService: ToastrService) {

    this.connection.on('ReceiveMessage', (message: iMessage) => {

      console.log(message)
      if (message.disappearAfter) {
        let loggedInUsername = sessionStorage.getItem('user');

        if (message.user == loggedInUsername) {
          this.onClickViewMessage(message);
        }
      }

      this.messages = [...this.messages, message]
      this.messages$.next(this.messages)
      console.log(this.messages)
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

  showMessage(id: string): void {
    const currentSet = new Set(this.visibleMessages.getValue());
    currentSet.add(id);
    this.visibleMessages.next(currentSet);
  }

  public onClickViewMessage(message: iMessage){
    if (message.disappearAfter) {
      //this.startCountdown(message);
      setTimeout(() => {
        this.messages = this.messages.filter(msg => msg !== message);
        this.messages$.next(this.messages);
      }, message.disappearAfter * 1000);
    }
  }

  // startCountdown(message: iMessage){
  //   this.time.next(message.remainingTime!);
  //   const totalDuration = message.disappearAfter || 1;
  //   this.remainingPercentage.next((message.remainingTime! / totalDuration) * 100);
  //   if (!message.remainingTime) return;

  //   const countdown$ = interval(1000);

  //   this.countdownIntervals[message.content] = countdown$.subscribe(() => {
  //     if(message.remainingTime !== null){
  //       if (message.remainingTime! > 0) {
  //         message.remainingTime! -= 1; // Decrement remaining time
  //         this.time.next(message.remainingTime!);
  //         const totalDuration = message.disappearAfter || 1;
  //         this.remainingPercentage.next((message.remainingTime! / totalDuration) * 100);
  //         console.log("remainingPercentage")
  //         console.log((message.remainingTime! / totalDuration) * 100)
  //         //this.cdr.detectChanges();
  //        }
  //        else {
  //         //this.removeMessage(message); // Remove message when timer reaches 0
  //         this.countdownIntervals[message.content].unsubscribe();
  //        }
  //     }
  //   });
  // }

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
