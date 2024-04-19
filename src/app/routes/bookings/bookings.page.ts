import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  InputSignal,
  Signal,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { Booking } from 'src/app/domain/booking.type';
import { Activity, NULL_ACTIVITY } from '../../domain/activity.type';
import { ActivityTitlePipe } from './activity-title.pipe';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, UpperCasePipe, ActivityTitlePipe, FormsModule],
  template: `
    @if (activity(); as activity) {
      <article>
        <header>
          <h2>{{ activity | activityTitle }}</h2>
          <div [class]="activity.status">
            <span>{{ activity.price | currency }}</span>
            <span>{{ activity.date | date: 'dd-MMM-yyyy' }}</span>
            <span>{{ activity.status | uppercase }}</span>
          </div>
        </header>
        <main>
          <h4>Participants</h4>
          <div>Already Participants: {{ currentParticipants() }}</div>
          <div>Max Participants: {{ activity.maxParticipants }}</div>
          <ul>
            <li>New Participants: {{ newParticipants() }}</li>
            <li>
              Remaining places:
              {{ remainingPlaces() }}
            </li>
            <li>Total Participants: {{ totalParticipants() }}</li>
          </ul>
          <div>
            @for (participant of participants(); track participant.id) {
              <span [attr.data-tooltip]="participant.id">☝</span>
            } @empty {
              <span>No participants yet</span>
            }
          </div>
        </main>
        <footer>
          @if (isBookable()) {
            <h4>New Bookings</h4>
            @if (remainingPlaces() > 0) {
              <label for="newParticipants">How many participants want to book?</label>
              <input
                type="number"
                name="newParticipants"
                [ngModel]="newParticipants()"
                (ngModelChange)="onNewParticipantsChange($event)"
                min="0"
                [max]="maxNewParticipants()"
              />
            } @else {
              <div>
                <button class="secondary outline" (click)="onNewParticipantsChange(0)">
                  Reset
                </button>
                <span>Sorry, no more places available!</span>
              </div>
            }
            <button [disabled]="booked() || newParticipants() === 0" (click)="onBook()">
              Book {{ newParticipants() }} places now for {{ bookingAmount() | currency }}
            </button>
            <div>{{ bookedMessage() }}</div>
          }
        </footer>
      </article>
    }
  `,
  styles: `
    .draft {
      color: violet;
      font-style: italic;
    }
    .published {
      color: limegreen;
    }
    .confirmed {
      color: green;
    }
    .sold-out {
      color: green;
      font-style: italic;
    }
    .done {
      color: orange;
      font-style: italic;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BookingsPage {
  #http$ = inject(HttpClient);
  #activitiesUrl = 'http://localhost:3000/activities';
  #bookingsUrl = 'http://localhost:3000/bookings';
  #title = inject(Title);
  #meta = inject(Meta);
  slug: InputSignal<string> = input.required<string>();
  slug$: Observable<string> = toObservable(this.slug);
  activity$: Observable<Activity> = this.slug$.pipe(
    switchMap((slug: string) => {
      const activityUrl = `${this.#activitiesUrl}?slug=${slug}`;
      return this.#http$.get<Activity[]>(activityUrl).pipe(
        map((activities: Activity[]) => activities[0] || NULL_ACTIVITY),
        catchError(() => of(NULL_ACTIVITY)),
      );
    }),
  );
  readonly activity: Signal<Activity> = toSignal(this.activity$, { initialValue: NULL_ACTIVITY });
  readonly participants = signal<{ id: number }[]>([]);
  readonly currentParticipants = computed(() =>
    Math.floor(Math.random() * this.activity().maxParticipants),
  );
  readonly maxNewParticipants = computed(
    () => this.activity().maxParticipants - this.currentParticipants(),
  );
  readonly isBookable = computed(() => ['published', 'confirmed'].includes(this.activity().status));
  readonly totalParticipants = computed(() => this.currentParticipants() + this.newParticipants());
  readonly remainingPlaces = computed(
    () => this.activity().maxParticipants - this.totalParticipants(),
  );
  readonly canNotBook = computed(() => this.booked() || this.newParticipants() === 0);
  readonly bookingAmount = computed(() => this.newParticipants() * this.activity().price);
  readonly newParticipants = signal(0);
  readonly booked = signal(false);
  readonly bookedMessage = computed(() => {
    if (this.booked()) return `Booked USD ${this.bookingAmount()}`;
    return '';
  });

  constructor() {}

  onNewParticipantsChange(newParticipants: number) {
    if (newParticipants > this.maxNewParticipants()) {
      newParticipants = this.maxNewParticipants();
    }
    this.newParticipants.set(newParticipants);
  }

  onBook() {
    this.booked.set(true);

    const newBooking: Booking = {
      id: 0,
      userId: 0,
      activityId: this.activity().id,
      date: new Date(),
      participants: this.newParticipants(),
      payment: {
        method: 'creditCard',
        amount: this.bookingAmount(),
        status: 'pending',
      },
    };

    this.#http$.post(this.#bookingsUrl, newBooking).subscribe({
      next: (res) => {
        console.log(res);
        this.#updateActivityStatus();
      },
      error: (error) => {
        console.error('Error creating booking', error);
      },
    });
  }

  #updateActivityStatus() {
    const activityUrl = `${this.#activitiesUrl}/${this.activity().id}`;
    this.#http$.put<Activity>(activityUrl, this.activity()).subscribe({
      next: () => console.log('Activity status updated'),
      error: (error) => console.error('Error updating activity', error),
    });
  }
}
