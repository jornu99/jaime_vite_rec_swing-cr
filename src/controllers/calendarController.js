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

    this.container.querySelectorAll('.delete-quick-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar evento?')) {
          this.repo.delete(btn.dataset.id);
          this.render();
        }
      };
    });

    this.container.querySelectorAll('.event-card').forEach(card => {
      card.onclick = () => this.showDetail(card.dataset.id);
    });

    this.container.querySelectorAll('.delete-quick-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.showConfirmDelete(btn.dataset.id);
      };
    });
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
    if (!events || events.length === 0) {
      return `<div class="no-events">Sin eventos</div>`;
    }
    return events.map(ev => `
      <div class="event-card ${ev.type}" data-id="${ev.id}">
          <button class="delete-quick-btn" data-id="${ev.id}">&times;</button>
          <div class="event-title">${ev.name}</div>
          <div class="event-time-location">${ev.startTime} → ${ev.location}</div>
      </div>
    `).join('');
  }

  showDetail(id) {
    const event = this.repo.getAll().find(e => e.id === id);
    if (!event) return;

    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    const deleteBtn = document.getElementById('delete-event-btn');

    body.innerHTML = `
        <h3>${event.name}</h3>
        <p><strong>Ubicación:</strong> ${event.location}</p>
        <p><strong>Horario:</strong> ${event.startTime} - ${event.endTime}</p>
        <hr>
        ${event.type === 'class' ? `
            <p><strong>Profesores:</strong> ${event.teachers}</p>
            <p><strong>Estilo:</strong> ${event.style} | <strong>Nivel:</strong> ${event.level}</p>
        ` : `
            <p><strong>Tipo:</strong> ${event.activityType}</p>
            <p><strong>Banda:</strong> ${event.band || 'N/A'}</p>
            <p><strong>Descripción:</strong> ${event.description}</p>
        `}
    `;

    modal.style.display = 'flex';

    deleteBtn.onclick = () => {
      this.showConfirmDelete(id);
    };

    modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
  }

  showConfirmDelete(id) {
    const modal = document.getElementById('confirm-modal');
    const btnConfirm = document.getElementById('btn-confirm-delete');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    const btnClose = modal.querySelector('.close-confirm');

    modal.style.display = 'flex';

    const close = () => { modal.style.display = 'none'; };

    btnConfirm.onclick = () => {
      this.repo.delete(id);
      this.render();
      close();
      document.getElementById('event-modal').style.display = 'none';
    };

    btnCancel.onclick = close;
    btnClose.onclick = close;

    modal.onclick = (e) => { if (e.target === modal) close(); };
  }
}
