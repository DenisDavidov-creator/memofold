CREATE TABLE deck_schedules(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INT,

    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE step_schedules(
    id SERIAL PRIMARY KEY,
    deck_schedule_id INT NOT NULL,
    "level" INT NOT NULL,
    interval_minutes int NOT NULL,

    CONSTRAINT fk_deck_schedule FOREIGN KEY(deck_schedule_id) REFERENCES deck_schedules(id) ON DELETE CASCADE,
    CONSTRAINT unique_level_per_schedule UNIQUE (deck_schedule_id, "level")

    
);