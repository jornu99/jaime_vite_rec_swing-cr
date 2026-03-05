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
        this.form.addEventListener('change', (e) => {
            if (e.target.name === 'day' || e.target.name === 'startTime' || e.target.name === 'type') {
                this.updateAvailableLocations();
            }
        }, true);
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

        const validHours = {
            FRIDAY: [20, 21, 22, 23],
            SATURDAY: [...Array(24).keys()],
            SUNDAY: [...Array(21).keys()]
        };
        const hour = parseInt(startTime.split(':')[0]);

        if (!validHours[day] || !validHours[day].includes(hour)) {
            this.showError(`Error: Hora ${startTime} no permitida para el ${day}`);
            return;
        }

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

    calculateEndTime(startTime, duration) {
        const [h, m] = startTime.split(':').map(Number);
        const total = h * 60 + m + duration;
        const endH = Math.floor(total / 60);
        const endM = total % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    updateAvailableLocations() {
        const formData = new FormData(this.form);
        const type = formData.get('type') || 'class';
        const day = formData.get('day') || 'FRIDAY';
        const startTime = formData.get('startTime') || '20:00';

        const availableLocations = this.getAvailableLocations(type, day, startTime);
        this.populateLocationSelect(availableLocations);

        if (availableLocations.length === 0) {
            this.showError('No hay ubicaciones disponibles en este horario');
        } else {
            this.clearError();
        }
    }

    getAvailableLocations(type, day, startTime) {
        const allEvents = this.repo.getAll();
        const proposedEndTime = this.calculateEndTime(startTime, 60);
        const allLocations = type === 'class' ? CLASSROOMS : ACTIVITY_LOCATIONS;

        const conflictingEvents = allEvents.filter(event =>
            event.day === day &&
            this.timesOverlap(event.startTime, event.endTime, startTime, proposedEndTime)
        );

        const usedLocations = new Set(conflictingEvents.map(e => e.location));
        return allLocations.filter(loc => !usedLocations.has(loc));
    }

    populateLocationSelect(locations) {
        this.locationSelect.innerHTML = locations.length > 0
            ? locations.map(loc => `<option value="${loc}">${loc}</option>`).join('')
            : '<option value="">Sin ubicaciones disponibles</option>';
    }

    timesOverlap(start1, end1, start2, end2) {
        const toMinutes = (time) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
        const s1 = toMinutes(start1);
        const e1 = toMinutes(end1);
        const s2 = toMinutes(start2);
        const e2 = toMinutes(end2);
        return s1 < e2 && s2 < e1;
    }

    createEvent(type, day, startTime, endTime, name, location, formData) {
        const id = crypto.randomUUID();
        const commonData = { id, name, day, startTime, endTime, location };

        if (type === 'class') {
            return new ClassEvent({
                ...commonData,
                teachers: formData.get('teachers') || '',
                style: formData.get('style') || STYLES[0],
                level: formData.get('level') || LEVELS[0]
            });
        } else {
            return new ActivityEvent({
                ...commonData,
                activityType: formData.get('activityType') || ACTIVITY_TYPES.SOCIAL,
                band: formData.get('band') || '',
                description: formData.get('description') || ''
            });
        }
    }

    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.className = 'error-message';
        this.errorDiv.style.display = 'block';

        setTimeout(() => {
            this.clearError();
        }, 4000);
    }

    showSuccess(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.className = 'success-message';
        this.errorDiv.style.display = 'block';
        setTimeout(() => this.clearError(), 3000);
    }

    clearError() {
        this.errorDiv.textContent = '';
        this.errorDiv.style.display = 'none';
    }
}