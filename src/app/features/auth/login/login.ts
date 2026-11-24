
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  async onSubmit() {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email, this.password);

      await this.router.navigate(['/admin']);

    } catch (error) {
      this.errorMessage =
        'Correo electrónico o contraseña incorrectos.';
    } finally {
      this.loading = false;
    }
  }
}
