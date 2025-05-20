import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  protected readonly Math = Math;

  get visiblePages(): number[] {
    const delta = 2; // Número de páginas a mostrar antes y después de la página actual
    const range: number[] = [];
    const rangeWithDots: number[] = [];
    let l: number;

    for (let i = 1; i <= this.totalPages; i++) {
      if (
        i === 1 || 
        i === this.totalPages ||
        (i >= this.currentPage - delta && i <= this.currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push(-1); // Usar -1 para representar "..."
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return range;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}