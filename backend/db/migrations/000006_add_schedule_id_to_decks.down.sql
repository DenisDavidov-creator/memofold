ALTER TABLE decks DROP CONSTRAINT fk_deck_schedule(id);

ALTER TABLE decks DROP COLUMN schedule_id;