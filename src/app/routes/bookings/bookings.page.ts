import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ACTIVITIES } from 'src/app/domain/activities.data';
import { NULL_ACTIVITY } from '../../domain/activity.type';
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
              <button class="secondary outline" (click)="onNewParticipantsChange(0)">Reset</button>
              <span>Sorry, no more places available!</span>
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
  #title = inject(Title);
  #meta = inject(Meta);
  slug = input<string>();
  readonly activity = computed(
    () => ACTIVITIES.find((activity) => activity.slug === this.slug()) || NULL_ACTIVITY,
  );
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

  constructor() {
    effect(() => {
      const activity = this.activity();
      this.#title.setTitle(activity.name);
      const description = `${activity.name} in ${activity.location} on ${activity.date} for ${activity.price}`;
      this.#meta.updateTag({ name: 'description', content: description });
    });
    effect(
      () => {
        this.participants.update((participants) => {
          participants.splice(0, participants.length);
          for (let i = 0; i < this.totalParticipants(); i++) {
            participants.push({ id: participants.length + 1 });
          }
          return participants;
        });
      },
      {
        allowSignalWrites: true,
      },
    );
    effect(() => {
      if (!this.isBookable()) {
        return;
      }
      const totalParticipants = this.totalParticipants();
      const activity = this.activity();
      let newStatus = activity.status;
      if (totalParticipants >= activity.maxParticipants) {
        newStatus = 'sold-out';
      } else if (totalParticipants >= activity.minParticipants) {
        newStatus = 'confirmed';
      } else {
        newStatus = 'published';
      }
      activity.status = newStatus;
    });
  }

  onNewParticipantsChange(newParticipants: number) {
    if (newParticipants > this.maxNewParticipants()) {
      newParticipants = this.maxNewParticipants();
    }
    this.newParticipants.set(newParticipants);
  }

  onBook() {
    this.booked.set(true);
  }
}
