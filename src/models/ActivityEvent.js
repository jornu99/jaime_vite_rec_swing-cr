import { Event } from './Event.js';
import { EVENT_TYPES, ACTIVITY_TYPES } from '../utils/constants.js';

export class ActivityEvent extends Event {
    constructor({ activityType, band, description, ...base }) {
        super({
            ...base,
            type: EVENT_TYPES.ACTIVITY
        });
        this.activityType = ACTIVITY_TYPES[activityType] || activityType;
        this.band = band || '';
        this.description = description || '';
    }
}
