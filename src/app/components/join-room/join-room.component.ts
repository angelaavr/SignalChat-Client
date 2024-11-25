import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './join-room.component.html',
  styleUrl: './join-room.component.css'
})
export class JoinRoomComponent implements OnInit {

  joinRoomForm!: FormGroup;

  constructor(private router: Router,
    private chatService: ChatService) { }

  ngOnInit(): void {
    this.joinRoomForm = new FormGroup({
      user: new FormControl('', Validators.required),
      room: new FormControl('', Validators.required)
    })
  }

  joinRoom() {
    const { user, room } = this.joinRoomForm.value;
    sessionStorage.setItem('user', user)
    sessionStorage.setItem('room', room)

    this.chatService.joinRoom(user, room)
      .then(() => {
        this.router.navigate(['chat'])
        this.chatService.newUser(user, room);
      })
      .catch(err => console.log(err))
  }
}
