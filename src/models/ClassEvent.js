import { Event } from './Event.js';
import { EVENT_TYPES, STYLES, LEVELS } from '../utils/constants.js';

export class ClassEvent extends Event {
    constructor({ teachers, style, level, ...base }) {
        super({
            ...base,
            type: EVENT_TYPES.CLASS
        });
        this.teachers = teachers;
        this.style = STYLES[style] || style;
        this.level = LEVELS[level] || level;
    }
}
