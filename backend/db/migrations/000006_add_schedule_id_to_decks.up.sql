ALTER TABLE decks ADD COLUMN schedule_id INT NOT NULL;

ALTER TABLE decks ADD CONSTRAINT fk_deck_schedule FOREIGN KEY(schedule_id) REFERENCES deck_schedules(id)