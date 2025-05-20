// success-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-modal.component.html',
  styleUrls: ['./success-modal.component.css']
})
export class SuccessModalComponent {
  @Input() show = false;
  @Input() title = '';
  @Input() message = '';
  @Input() type: 'success' | 'error' = 'success';
  
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}