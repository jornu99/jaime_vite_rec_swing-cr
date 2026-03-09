import { FESTIVAL_DAYS } from '../utils/constants.js';

export class CalendarController {
  constructor(repo) {
    this.repo = repo;
    this.container = document.getElementById('calendar');
  }

  render() {
    if (!this.container) return;
    const events = this.repo.getAll();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    this.container.innerHTML = `
            <div class="calendar-grid">
                ${Object.keys(FESTIVAL_DAYS).map(dayKey => `
                    <div class="day-column">
                        <div class="day-header">${FESTIVAL_DAYS[dayKey]}</div>
                        <div class="time-slots">
                            ${hours.map(h => {
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      const eventsInSlot = events.filter(e => e.day === dayKey && e.startTime === timeStr);
      return `
                                    <div class="hour-slot" data-day="${dayKey}" data-time="${timeStr}">
                                        <span class="slot-time-label">${timeStr}</span>
                                        <div class="slot-events-container">
                                            ${eventsInSlot.map(ev => `
                                                <div class="event-card ${ev.type}" data-id="${ev.id}" draggable="true">
                                                    <button class="delete-quick-btn" data-id="${ev.id}">❌</button>
                                                    <div class="event-title">${ev.name}</div>
                                                    <div class="event-time-location">${ev.location}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    this.setupListeners();
  }

  setupListeners() {
    this.container.querySelectorAll('.event-card').forEach(card => {
      card.onclick = () => this.showDetail(card.dataset.id);
      card.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
      };
      card.ondragend = () => card.classList.remove('dragging');
    });

    this.container.querySelectorAll('.delete-quick-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.confirmDelete(btn.dataset.id);
      };
    });

    this.container.querySelectorAll('.hour-slot').forEach(slot => {
      slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('slot-hover'); };
      slot.ondragleave = () => slot.classList.remove('slot-hover');
      slot.ondrop = (e) => {
        e.preventDefault();
        slot.classList.remove('slot-hover');
        this.handleDrop(e.dataTransfer.getData('text/plain'), slot.dataset.day, slot.dataset.time);
      };
    });
  }

  handleDrop(id, day, time) {
    const all = this.repo.getAll();
    const ev = all.find(e => e.id === id);
    if (!ev) return;

    const hour = parseInt(time.split(':')[0]);
    const VALID_HOURS = {
      FRIDAY: [20, 21, 22, 23],
      SATURDAY: Array.from({ length: 24 }, (_, i) => i),
      SUNDAY: Array.from({ length: 21 }, (_, i) => i)
    };

    if (!VALID_HOURS[day].includes(hour)) {
      alert(`Esa hora no está permitida para el día seleccionado.`);
      return;
    }

    const end = this.calculateEndTime(time, 60);
    const occupied = all.some(other =>
      other.id !== id && other.day === day && other.location === ev.location &&
      this.checkOverlap(other.startTime, other.endTime, time, end)
    );

    if (occupied) {
      alert(`La sala "${ev.location}" ya está ocupada en ese horario.`);
      return;
    }

    ev.day = day;
    ev.startTime = time;
    ev.endTime = end;
    this.repo.save();
    this.render();
  }

  checkOverlap(s1, e1, s2, e2) {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    return toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
  }

  calculateEndTime(start, dur) {
    const [h, m] = start.split(':').map(Number);
    const t = h * 60 + m + dur;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }

  showDetail(id) {
    const ev = this.repo.getAll().find(e => e.id === id);
    if (!ev) return;

    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');

    let detailHtml = `
            <h3>${ev.name}</h3>
            <p><strong>Ubicación:</strong> ${ev.location}</p>
            <p><strong>Horario:</strong> ${ev.startTime} - ${ev.endTime}</p>
            <hr>
        `;

    if (ev.type === 'class') {
      detailHtml += `
                <p><strong>Profesores:</strong> ${ev.teachers || 'No asignados'}</p>
                <p><strong>Estilo:</strong> ${ev.style} | <strong>Nivel:</strong> ${ev.level}</p>
            `;
    } else {
      detailHtml += `
                <p><strong>Tipo:</strong> ${ev.activityType}</p>
                <p><strong>Banda:</strong> ${ev.band || 'Sin banda'}</p>
                <p><strong>Descripción:</strong> ${ev.description || 'Sin descripción'}</p>
            `;
    }

    body.innerHTML = detailHtml;
    modal.style.display = 'flex';
    modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    document.getElementById('delete-event-btn').onclick = () => this.confirmDelete(id);
  }

  confirmDelete(id) {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'flex';
    document.getElementById('btn-confirm-delete').onclick = () => {
      this.repo.delete(id);
      this.render();
      modal.style.display = 'none';
      document.getElementById('event-modal').style.display = 'none';
    };
    document.getElementById('btn-confirm-cancel').onclick = () => modal.style.display = 'none';
  }
}