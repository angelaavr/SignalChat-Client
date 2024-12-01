import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { UserRoom } from '../../interfaces/user-room';
import { iMessage } from '../../interfaces/message';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {

  sendMessageInput = new FormControl('', Validators.required)
  countdownIntervals: { [key: string]: Subscription } = {}; // Track each message's countdown

  messages: any[] = []

  loggedInUsername = sessionStorage.getItem('user');
  roomName = sessionStorage.getItem('room');

  //Timer
  timerOptions = [
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: 'Off', value: null },
  ];

  showTimerOptions = false;
  disappearTime: number | null = null;
  time: number | null = null;
  remainingPercentage: number | null = null;

  @ViewChild('scrollMe') private scrollContainer!: ElementRef

  visibleMessages = new Set<string>();

  constructor(public chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private router: Router) { }

  ngOnInit(): void {
    this.chatService.visibleMessages$.subscribe((visibleMessages) => {
      console.log(visibleMessages)
      this.visibleMessages = visibleMessages;
    });
  }   

  ngOnDestroy(): void {
    this.chatService.messages$.unsubscribe()
  }

  ngAfterViewChecked(): void {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
  }

  showMessage(id: string): void {
    this.chatService.showMessage(id);
  }

  sendMessage() {
    if (this.sendMessageInput.invalid) return;

    let remainingPercentage = null;

    const message: iMessage = {
      id: this.generateUniqueId(),
      content: this.sendMessageInput.value as string,
      user: '',
      messageTime: '',
      disappearAfter: this.disappearTime,
      remainingTime: this.disappearTime || null,
      remainingPercentage: remainingPercentage
    };

    this.chatService.sendMessage(message).then(() => {
      this.sendMessageInput.setValue('');
      if (message.remainingTime) {
        //this.startCountdown(message); // Start countdown if remainingTime is set
      }
      this.disappearTime = null;

    }).catch(err => console.log(err))

    this.onFocusChange(false);
  }

  //CountDown
  // startCountdown(message: iMessage){
  //   this.time = message.remainingTime!;
  //   const totalDuration = message.disappearAfter || 1;
  //   this.remainingPercentage = (message.remainingTime! / totalDuration) * 100;

  //   if (!message.remainingTime) return; // Only start countdown if remainingTime is set

  //   // Create an interval that triggers every second
  //   const countdown$ = interval(1000);

  //   this.countdownIntervals[message.content] = countdown$.subscribe(() => {
  //     if (message.remainingTime! > 0) {
  //       message.remainingTime! -= 1; // Decrement remaining time
  //       this.time = message.remainingTime;
  //       const totalDuration = message.disappearAfter || 1;
  //       this.remainingPercentage = (message.remainingTime! / totalDuration) * 100;
  //       this.cdr.detectChanges();
  //      }
  //      else {
  //       this.removeMessage(message); // Remove message when timer reaches 0
  //       this.countdownIntervals[message.content].unsubscribe();
  //      }
  //   });
  // }

  // removeMessage(message: any) {
  //   this.messages = this.messages.filter(msg => msg !== message);
  // }

  leaveChat() {
    this.chatService.leaveChat().then(() => {
      this.router.navigate(['welcome'])

      setTimeout(() => {
        location.reload()
      }, 0)

    }).catch(err => console.log(err))
  }

  onInputChange(e: string) {
    const { user, room } = this.chatService.activeUserAndRoom$.value as UserRoom;

    if (this.sendMessageInput.valid) {
      this.chatService.setTypingTrue(user, room).then(() => { }).catch(err => console.log(err))
    } else {
      this.chatService.setTypingFalse(user, room).then(() => { }).catch(err => console.log(err))
    }
  }

  onFocusChange(isFocusOn: boolean) {
    const { user, room } = this.chatService.activeUserAndRoom$.value as UserRoom;

    if (!isFocusOn) {
      this.chatService.setTypingFalse(user, room).then(() => { }).catch(err => console.log(err))
    }

    if (isFocusOn && this.sendMessageInput.valid) {
      this.chatService.setTypingTrue(user, room).then(() => { }).catch(err => console.log(err))
    }
  }

  toggleTimerOptions() {
    this.showTimerOptions = !this.showTimerOptions;
  }

  selectDisappearingTime(time: number | null) {
    this.disappearTime = time;
    this.showTimerOptions = false;
  }

  generateUniqueId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

}
