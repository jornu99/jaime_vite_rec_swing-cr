const STORAGE_KEY = 'swingCR2026';

export class EventRepository {
    constructor() {
        this.events = [];
        this.load();
    }

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            this.events = data ? JSON.parse(data) : [];
        } catch {
            this.events = [];
        }
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    }

    add(event) {
        this.events.push(event);
        this.save();
    }

    getAll() {
        return [...this.events];
    }

    delete(id) {
        this.events = this.events.filter(ev => ev.id !== id);
        this.save();
    }
}
