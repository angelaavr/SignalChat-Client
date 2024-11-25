import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { UserRoom } from '../../interfaces/user-room';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {

  sendMessageInput = new FormControl('', Validators.required)

  messages: any[] = []

  loggedInUsername = sessionStorage.getItem('user');
  roomName = sessionStorage.getItem('room');

  @ViewChild('scrollMe') private scrollContainer!: ElementRef

  constructor(public chatService: ChatService,
    private router: Router) { }

  ngOnInit(): void {
    this.chatService.messages$.subscribe(response => {
      this.messages = response
    })
  }

  ngOnDestroy(): void {
    this.chatService.messages$.unsubscribe()
  }

  ngAfterViewChecked(): void {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
  }

  sendMessage() {
    if (this.sendMessageInput.invalid) return;

    this.chatService.sendMessage(this.sendMessageInput.value as string).then(() => {
      this.sendMessageInput.setValue('')
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

}
