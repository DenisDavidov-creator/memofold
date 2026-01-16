CREATE TABLE card_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    deck_id INT NOT NULL,
    card_id INT NOT NULL, 
    review_date DATE NOT NULL,
    is_correct BOOLEAN NOT NULL,

    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_deck FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
);