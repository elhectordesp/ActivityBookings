import { CurrencyPipe, DatePipe, UpperCasePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Activity } from "../domain/activity.type";
import { ActivityTitlePipe } from "./activity-title.pipe";

@Component({
  selector: "lab-bookings",
  standalone: true,
  imports: [CurrencyPipe, DatePipe, UpperCasePipe, ActivityTitlePipe, FormsModule],
  template: `
    <article>
      <header>
        <h2>{{ activity | activityTitle }}</h2>
        <div [class]="activity.status">
          <span>{{ activity.price | currency }}</span>
          <span>{{ activity.date | date: "dd-MMM-yyyy" }}</span>
          <span>{{ activity.status | uppercase }}</span>
        </div>
      </header>
      <main>
        <h4>Participants</h4>
        <div>Already Participants: {{ currentParticipants }}</div>
        <div>
          @for (participant of participants(); track participant.id) {
            <span>{{ participant.id }}</span>
          } @empty {
            <span>No participants yet</span>
          }
        </div>
        <ul>
          <li>New Participants: {{ newParticipants() }}</li>
          <li>Total Participants: {{ totalParticipants() }}</li>
          <li>
            Remaining places:
            {{ remainingPlaces() }}
          </li>
        </ul>
      </main>
      <footer>
        <h4>New Bookings</h4>
        @if (remainingPlaces() > 0) {
          <label for="newParticipants">How many participants want to book?</label>
          <input
            type="number"
            [ngModel]="newParticipants"
            (ngModelChange)="onNewParticipantsChange($event)"
            min="0"
            [max]="maxNewParticipants"
          />
        } @else {
          <button class="secondary outline" (click)="onNewParticipantsChange(0)">Reset</button>
          <span>Sorry, no more places available!</span>
        }
        <button [disabled]="canNotBook()" (click)="onBook()">
          Book now for {{ bookingAmount() | currency }}
        </button>
        {{ booked() ? "Booked" : "" }}
      </footer>
    </article>
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
export class BookingsComponent {
  readonly activity: Activity = {
    name: "Paddle surf",
    location: "Tabarca Island",
    price: 100,
    date: new Date(2025, 7, 15),
    minParticipants: 4,
    maxParticipants: 10,
    status: "published",
    id: 1,
    slug: "paddle-surf",
    duration: 2,
    userId: 1,
  };
  readonly participants = signal<{ id: number }[]>([{ id: 1 }, { id: 2 }, { id: 3 }]);
  readonly currentParticipants = 3;
  readonly maxNewParticipants = this.activity.maxParticipants - this.currentParticipants;
  readonly totalParticipants = computed(() => this.currentParticipants + this.newParticipants());
  readonly remainingPlaces = computed(
    () => this.activity.maxParticipants - this.totalParticipants(),
  );
  readonly canNotBook = computed(() => this.booked() || this.newParticipants() === 0);
  readonly bookingAmount = computed(() => this.newParticipants() * this.activity.price);
  readonly newParticipants = signal(0);
  readonly booked = signal(false);

  constructor() {
    effect(() => {
      const totalParticipants = this.totalParticipants();
      const activity = this.activity;
      if (totalParticipants >= activity.maxParticipants) {
        activity.status = "sold-out";
      } else if (totalParticipants >= activity.minParticipants) {
        activity.status = "confirmed";
      } else {
        activity.status = "published";
      }
    });
  }

  onNewParticipantsChange(newParticipants: number) {
    this.newParticipants.set(newParticipants);
    this.participants.update((participants) => {
      participants = participants.slice(0, this.currentParticipants);
      for (let i = 0; i < newParticipants; i++) {
        participants.push({ id: participants.length + 1 });
      }
      return participants;
    });
  }

  onBook() {
    this.booked.set(true);
  }
}
