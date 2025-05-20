// src/app/modules/pqrs/listar-pqrs/listar-pqrs.component.ts
import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { PqrsService } from '../../../core/services/pqrs.service';
import { PQRS } from '../../../shared/models/pqrs.model';

@Component({
  selector: 'app-listar-pqrs',
  standalone: true,
  imports: [NgFor],
  template: `
    <div *ngFor="let pqrs of listaPqrs">
      {{ pqrs.numeroRadicado }} - {{ pqrs.titulo }}
    </div>
  `
})
export class ListarPqrsComponent implements OnInit {
  listaPqrs: PQRS[] = [];

  constructor(private pqrsService: PqrsService) {}

  ngOnInit() {
    this.pqrsService.listarPQRS().subscribe({
      next: (data: PQRS[]) => {
        this.listaPqrs = data;
      },
      error: (error) => {
        console.error('Error al cargar PQRS:', error);
      }
    });
  }
}