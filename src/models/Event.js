export class Event {
    constructor({ id, name, type, day, startTime, endTime, location }) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
    }
}
