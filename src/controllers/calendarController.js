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

    this.container.querySelectorAll('.event-card').forEach(card => {
      card.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.style.opacity = '0.5';
      };
      card.ondragend = () => card.style.opacity = '1';
    });

    this.container.querySelectorAll('.day-column').forEach(column => {
      column.ondragover = (e) => {
        e.preventDefault();
        column.style.background = '#f0f0f0';
      };

      column.ondragleave = () => {
        column.style.background = '#ffffff';
      };

      column.ondrop = (e) => {
        e.preventDefault();
        column.style.background = '#ffffff';
        const eventId = e.dataTransfer.getData('text/plain');
        const newDay = column.querySelector('.day-header').innerText.toUpperCase();

        this.handleDrop(eventId, newDay);
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
      <div class="event-card ${ev.type}"
          data-id="${ev.id}"
          draggable="true"
          style="position: relative;">
          <span class="delete-quick-btn" data-id="${ev.id}">&times;</span>
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

  handleDrop(eventId, newDay) {
    const event = this.repo.getAll().find(e => e.id === eventId);
    if (!event) return;

    const dayMap = { 'VIERNES': 'FRIDAY', 'SÁBADO': 'SATURDAY', 'SABADO': 'SATURDAY', 'DOMINGO': 'SUNDAY' };
    const dayKey = dayMap[newDay] || newDay;

    const hour = parseInt(event.startTime.split(':')[0]);
    const validHours = {
      FRIDAY: [20, 21, 22, 23],
      SATURDAY: Array.from({ length: 24 }, (_, i) => i),
      SUNDAY: Array.from({ length: 21 }, (_, i) => i)
    };

    if (!validHours[dayKey].includes(hour)) {
      alert(`No puedes mover este evento al ${newDay}. El horario (${event.startTime}) no está permitido.`);
      return;
    }

    const isOccupied = this.repo.getAll().some(otherEvent =>
      otherEvent.id !== eventId &&
      otherEvent.day === dayKey &&
      otherEvent.location === event.location &&
      this.checkOverlap(otherEvent.startTime, otherEvent.endTime, event.startTime, event.endTime)
    );

    if (isOccupied) {
      alert(`Error: No puedes moverlo aquí. La ubicación "${event.location}" ya está ocupada el ${newDay} a las ${event.startTime}.`);
      return;
    }

    event.day = dayKey;
    this.repo.save();
    this.render();
  }

  checkOverlap(start1, end1, start2, end2) {
    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    return toMin(start1) < toMin(end2) && toMin(start2) < toMin(end1);
  }
}
