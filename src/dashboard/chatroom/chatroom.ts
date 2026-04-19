import { Component, OnInit, signal } from '@angular/core';
import { ChatHub } from '../../services/chatHub';
import { Custominput } from '../../components/custominput/custominput';
import { Button } from '../../components/button/button';

@Component({
  selector: 'app-chatroom',
  imports: [Custominput,Button],
  templateUrl: './chatroom.html',
  styleUrl: './chatroom.scss',
})
export class Chatroom implements OnInit {
  user: string = '';
  public message = signal('');

  constructor(public chatHub: ChatHub) { }

  ngOnInit() {
    this.chatHub.startConnection();
    this.chatHub.addMessageListener();
  }

  sendMessage() {
    this.chatHub.sendMessage(this.user, this.message());
    this.message.set('');  // Clear the input after sending
  }
}
