import { ClassEvent } from '../models/ClassEvent.js';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { STYLES, LEVELS, ACTIVITY_TYPES, CLASSROOMS, ACTIVITY_LOCATIONS } from '../utils/constants.js';

export class EventFormController {
    constructor(repository, calendarController) {
        this.repo = repository;
        this.calendar = calendarController;
        this.form = document.getElementById('event-form');
        this.locationSelect = document.getElementById('event-location');
        this.errorDiv = document.getElementById('form-error');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        e.preventDefault();
        this.clearError();

        const formData = new FormData(e.target);
        const type = formData.get('type');
        const day = formData.get('day');
        const startTime = formData.get('startTime');
        const name = formData.get('name');
        const location = formData.get('location');

        if (!name || !location || !startTime) {
            this.showError('Por favor, rellena todos los campos obligatorios');
            return;
        }

        const endTime = this.calculateEndTime(startTime, 60);

        const isOccupied = this.repo.getAll().some(event =>
            event.day === day &&
            event.location === location &&
            this.timesOverlap(event.startTime, event.endTime, startTime, endTime)
        );

        if (isOccupied) {
            this.showError(`La ubicación "${location}" ya está ocupada en este horario.`);
            return;
        }

        const event = this.createEvent(type, day, startTime, endTime, name, location, formData);

        if (event) {
            this.repo.add(event);
            this.calendar.render();
            e.target.reset();
            this.updateAvailableLocations();
            this.showSuccess(`Evento "${name}" creado correctamente`);
        }
    }

    updateAvailableLocations() {
        const formData = new FormData(this.form);
        const type = formData.get('type') || 'class';
        const day = formData.get('day') || 'FRIDAY';
        const startTime = formData.get('startTime') || '20:00';

        const allEvents = this.repo.getAll();
        const proposedEndTime = this.calculateEndTime(startTime, 60);
        const allLocations = type === 'class' ? CLASSROOMS : ACTIVITY_LOCATIONS;

        const usedLocations = new Set(
            allEvents
                .filter(ev => ev.day === day && this.timesOverlap(ev.startTime, ev.endTime, startTime, proposedEndTime))
                .map(ev => ev.location)
        );

        const available = allLocations.filter(loc => !usedLocations.has(loc));

        this.locationSelect.innerHTML = available.length > 0
            ? available.map(loc => `<option value="${loc}">${loc}</option>`).join('')
            : '<option value="">Sin salas disponibles</option>';

        const btn = document.getElementById('submit-btn');
        if (available.length === 0) {
            this.showError('No hay salas libres para esta hora');
            if (btn) btn.disabled = true;
        } else {
            this.clearError();
            if (btn) btn.disabled = false;
        }
    }

    timesOverlap(start1, end1, start2, end2) {
        const toMin = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        return toMin(start1) < toMin(end2) && toMin(start2) < toMin(end1);
    }

    calculateEndTime(startTime, duration) {
        const [h, m] = startTime.split(':').map(Number);
        const total = h * 60 + m + duration;
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    }

    createEvent(type, day, startTime, endTime, name, location, formData) {
        const id = crypto.randomUUID();
        const base = { id, name, day, startTime, endTime, location };

        if (type === 'class') {
            return new ClassEvent({
                ...base,
                teachers: formData.get('teachers'),
                style: formData.get('style'),
                level: formData.get('level')
            });
        } else {
            return new ActivityEvent({
                ...base,
                activityType: formData.get('activityType'),
                band: formData.get('band'),
                description: formData.get('description')
            });
        }
    }

    showError(msg) {
        this.errorDiv.textContent = msg;
        this.errorDiv.style.display = 'block';
        this.errorDiv.className = 'error-message';
    }

    showSuccess(msg) {
        this.errorDiv.textContent = msg;
        this.errorDiv.style.display = 'block';
        this.errorDiv.className = 'success-message';
        setTimeout(() => this.clearError(), 2000);
    }

    clearError() {
        this.errorDiv.style.display = 'none';
    }
}