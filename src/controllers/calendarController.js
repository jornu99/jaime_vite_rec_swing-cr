import { FESTIVAL_DAYS } from '../utils/constants.js';

export class CalendarController {
  constructor(repo) {
    this.repo = repo;
    this.container = document.getElementById('calendar');
  }

  render() {
    if (!this.container) return;
    
    const events = this.repo.getAll();
    const eventsByDay = this.groupEventsByDay(events);
    
    this.container.innerHTML = `
      <h2 style="color: #343a40; margin-bottom: 1.5rem;">Programa del Festival</h2>
      <div class="calendar-grid">
        ${Object.keys(FESTIVAL_DAYS).map(dayKey => `
          <div class="day-column">
            <div class="day-header">${FESTIVAL_DAYS[dayKey]}</div>
            <div class="day-events">
              ${this.renderDayEvents(eventsByDay[dayKey])}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  groupEventsByDay(events) {
    const byDay = {};
    Object.keys(FESTIVAL_DAYS).forEach(dayKey => {
      byDay[dayKey] = [];
    });
    events.forEach(ev => {
      const dayKey = ev.day.toUpperCase();
      if (byDay[dayKey]) byDay[dayKey].push(ev);
    });
    return byDay;
  }

  renderDayEvents(events) {
    if (!events.length) {
      return '<p style="text-align:center; opacity:0.6; margin-top:2rem;">Sin eventos</p>';
    }
    return events.map(ev => `
            <div class="event-card ${ev.type}" data-id="${ev.id}">
                <div class="event-title">${ev.name}</div>
                <div class="event-time-location">${ev.startTime} → ${ev.location}</div>
            </div>
        `).join('');
  }
}
