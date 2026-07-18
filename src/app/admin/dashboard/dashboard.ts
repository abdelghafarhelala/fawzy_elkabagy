import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: '../admin.css',
})
export class AdminDashboard {}
