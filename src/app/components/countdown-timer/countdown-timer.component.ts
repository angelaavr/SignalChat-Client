import { Component, Input, OnInit } from '@angular/core';
import { iMessage } from '../../interfaces/message';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-timer.component.html',
  styleUrl: './countdown-timer.component.css'
})
export class CountdownTimerComponent implements OnInit {

  @Input() message!: iMessage;
  time: number = 0;
  remainingPercentage!: number;
  countdownIntervals: { [key: string]: Subscription } = {};

  ngOnInit() {
    this.time = this.message.remainingTime!;
    const totalDuration = this.message.disappearAfter || 1;
    this.remainingPercentage = (this.message.remainingTime! / totalDuration) * 100;

    if (!this.message.remainingTime) return;

    const countdown$ = interval(1000);

    this.countdownIntervals[this.message.content] = countdown$.subscribe(() => {
      if (this.message.remainingTime !== null) {
        if (this.message.remainingTime! > 0) {
          this.message.remainingTime! -= 1;
          this.time = this.message.remainingTime;
          const totalDuration = this.message.disappearAfter || 1;
          this.remainingPercentage = (this.message.remainingTime! / totalDuration) * 100;
        }
        else {
          this.countdownIntervals[this.message.content].unsubscribe();
        }
      }
    });
  }
}
