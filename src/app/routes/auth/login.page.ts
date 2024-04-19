import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <article>
      <header>
        <h2>Login</h2>
      </header>
      <main>
        <form>
          <label for="email">
            <span>Email</span>
            <input id="email" type="email" />
          </label>
          <label for="password">
            <span>Password</span>
            <input id="password" type="password" />
          </label>
          <button type="submit">Login</button>
        </form>
      </main>
    </article>
    <p>login works!</p>
    <a routerLink="/auth/register">Register</a>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginPage {}
