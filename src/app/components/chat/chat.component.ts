import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { UserRoom } from '../../interfaces/user-room';
import { iMessage } from '../../interfaces/message';
import { interval, Subscription } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CountdownTimerComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {

  sendMessageInput = new FormControl('', Validators.required)
  countdownIntervals: { [key: string]: Subscription } = {};

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
  time: number = 0;
  remainingPercentage: number | null = null;

  @ViewChild('scrollMe') private scrollContainer!: ElementRef

  visibleMessages = new Set<string>();

  constructor(public chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private router: Router) { }

  ngOnInit(): void {
    this.chatService.visibleMessages$.subscribe((visibleMessages) => {
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
      this.disappearTime = null;
    }).catch(err => console.log(err))

    this.onFocusChange(false);
  }


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
