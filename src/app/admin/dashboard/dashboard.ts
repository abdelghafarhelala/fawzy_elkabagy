import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: '../admin.css',
})
export class AdminDashboard {}
