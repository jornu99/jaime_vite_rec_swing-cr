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

        if (!location) {
            this.showError('No hay ubicaciones disponibles en este horario');
            return;
        }

        const event = this.createEvent(type, day, startTime, name, location, formData);

        if (event) {
            this.repo.add(event);
            this.calendar.render();
            e.target.reset();
            this.updateAvailableLocations();
            this.showSuccess(`Evento "${name}" creado correctamente`);
        }

        const validHours = { FRIDAY: [20, 21, 22, 23], SATURDAY: [...Array(24).keys()], SUNDAY: [...Array(20).keys()] };
        const hour = parseInt(startTime.split(':')[0]);

        if (!validHours[day].includes(hour)) {
            this.showError(`Hora no permitida para el ${day}`);
            return;
        }
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
        const proposedEndTime = type === 'class' ? '21:00' : '22:00';
        const allLocations = type === 'class' ? CLASSROOMS : ACTIVITY_LOCATIONS;

        const conflictingEvents = allEvents.filter(event =>
            this.timesOverlap(event.startTime, event.endTime, startTime, proposedEndTime) &&
            event.day === day
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
        const [h1, m1] = start1.split(':').map(Number);
        const [h2, m2] = end1.split(':').map(Number);
        const [h3, m3] = start2.split(':').map(Number);
        const [h4, m4] = end2.split(':').map(Number);

        const start1Minutes = h1 * 60 + m1;
        const end1Minutes = h2 * 60 + m2;
        const start2Minutes = h3 * 60 + m3;
        const end2Minutes = h4 * 60 + m4;

        return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
    }

    createEvent(type, day, startTime, name, location, formData) {
        const id = crypto.randomUUID();
        const endTime = type === 'class' ? '21:00' : '22:00';

        if (type === 'class') {
            return new ClassEvent({
                id,
                name,
                day,
                startTime,
                endTime,
                location,
                teachers: formData.get('teachers') || '',
                style: formData.get('style') || STYLES[0],
                level: formData.get('level') || LEVELS[0]
            });
        } else {
            return new ActivityEvent({
                id,
                name,
                day,
                startTime,
                endTime,
                location,
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
    }

    showSuccess(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.className = 'success-message';
        this.errorDiv.style.display = 'block';
        setTimeout(() => {
            this.clearError();
        }, 3000);
    }

    clearError() {
        this.errorDiv.textContent = '';
        this.errorDiv.style.display = 'none';
    }
}
