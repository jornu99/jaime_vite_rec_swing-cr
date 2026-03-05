import { EventRepository } from '../services/eventRepository.js';
import { EventFormController } from './eventFormController.js';
import { CalendarController } from './calendarController.js';
import { CLASSROOMS, ACTIVITY_LOCATIONS } from '../utils/constants.js';

export class AppController {
    constructor() {
        this.renderApp();
        this.repo = new EventRepository();
        this.calendar = new CalendarController(this.repo);
        this.calendar.render();
        this.formController = new EventFormController(this.repo, this.calendar);

        this.updateHours('FRIDAY');
        this.updateLocations('class');
        this.formController.updateAvailableLocations();
    }

    renderApp() {
        document.getElementById('app').innerHTML = `
            <h1>VIII Festival Swing Ciudad Real 2026</h1>
            
            <form id="event-form">
                <label>Tipo:
                <select name="type" id="event-type">
                    <option value="class">Clase</option>
                    <option value="activity">Actividad</option>
                </select>
                </label>

                <label>Día:
                <select name="day" id="event-day">
                    <option value="FRIDAY">Viernes</option>
                    <option value="SATURDAY">Sábado</option>
                    <option value="SUNDAY">Domingo</option>
                </select>
                </label>

                <label>Hora inicio:
                <select name="startTime" id="event-time"></select>
                </label>

                <label>Nombre:
                <input type="text" name="name" required>
                </label>

                <label>Ubicación:
                <select name="location" id="event-location"></select>
                </label>

                <div id="class-fields">
                <label>Profesores:
                    <input type="text" name="teachers">
                </label>
                <label>Estilo:
                    <select name="style">
                    <option value="LINDY_HOP">Lindy Hop</option>
                    <option value="SHAG">Shag</option>
                    <option value="SOLO_JAZZ">Solo Jazz</option>
                    <option value="BALBOA">Balboa</option>
                    <option value="CHARLESTON">Charleston</option>
                    </select>
                </label>
                <label>Nivel:
                    <select name="level">
                    <option value="BASIC">Básico</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                    </select>
                </label>
                </div>

                <div id="activity-fields" style="display:none">
                <label>Tipo actividad:
                    <select name="activityType">
                    <option value="TASTER">Taster</option>
                    <option value="SOCIAL">Social</option>
                    <option value="CONCERT">Concierto</option>
                    <option value="MIX_MATCH">Mix & Match</option>
                    </select>
                </label>
                <label>Banda:
                    <input type="text" name="band">
                </label>
                <label>Descripción:
                    <textarea name="description" rows="3"></textarea>
                </label>
                </div>

                <button type="submit">Crear Evento</button>

                <div id="form-error" style="display: none; margin-top: 1rem; padding: 0.75rem; border-radius: 4px; font-weight: 500;"></div>
            </form>

            <div id="calendar"></div>

            <div id="event-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <div id="modal-body"></div>
                    <div class="modal-footer">
                        <button id="delete-event-btn" class="btn-delete">Eliminar Evento</button>
                    </div>
                </div>
            </div>

            <div id="confirm-modal" class="modal" style="display: none;">
                <div class="modal-content confirmation-size">
                    <span class="close-confirm close-modal">&times;</span>
                    <div id="confirm-body">
                        <h3>¿Estás seguro?</h3>
                        <p>Esta acción no se puede deshacer.</p>
                    </div>
                    <div class="confirm-footer">
                        <button id="btn-confirm-delete" class="btn-delete">Eliminar</button>
                        <button id="btn-confirm-cancel" class="btn-secondary">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('event-type').onchange = (e) => {
            this.toggleFields(e.target.value);
            this.updateLocations(e.target.value);
            this.formController.updateAvailableLocations();
        };

        document.getElementById('event-day').onchange = (e) => {
            this.updateHours(e.target.value);
            this.formController.updateAvailableLocations();
        };
    }

    toggleFields(type) {
        document.getElementById('class-fields').style.display = type === 'class' ? 'block' : 'none';
        document.getElementById('activity-fields').style.display = type === 'activity' ? 'block' : 'none';
    }

    updateLocations(type) {
        const locationSelect = document.getElementById('event-location');
        const locations = type === 'class' ? CLASSROOMS : ACTIVITY_LOCATIONS;
        locationSelect.innerHTML = locations.map(loc =>
            `<option value="${loc}">${loc}</option>`
        ).join('');
    }

    updateHours(day) {
        const timeSelect = document.getElementById('event-time');
        const hours = {
            FRIDAY: Array.from({ length: 4 }, (_, i) => 20 + i),
            SATURDAY: Array.from({ length: 24 }, (_, i) => i),
            SUNDAY: Array.from({ length: 21 }, (_, i) => i)
        };
        timeSelect.innerHTML = hours[day].map(h =>
            `<option value="${h.toString().padStart(2, '0')}:00">${h.toString().padStart(2, '0')}:00</option>`
        ).join('');
    }
}
