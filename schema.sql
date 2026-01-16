CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(64) UNIQUE NOT NULL,
    "login" VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE
);

CREATE TABLE decks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    current_level INT NOT NULL DEFAULT 0,
    next_review_date DATE NOT NULL,
    
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    original_word VARCHAR(255) NOT NULL,
    translation VARCHAR(255) NOT NULL,

    original_context TEXT, 
    translation_context TEXT

);

CREATE TABLE deck_cards ( 
    deck_id INT NOT NULL,
    card_id INT NOT NULL,
    PRIMARY KEY(deck_id, card_id),

    CONSTRAINT fk_deck FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE, 
    CONSTRAINT fk_card FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE user_card_stats (
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    is_difficult BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(user_id, card_id),

    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE deck_history (
    id SERIAL PRIMARY KEY,
    deck_id INT NOT NULL,
    review_date DATE NOT NULL,
    accuracy INT NOT NULL, 
    
    CONSTRAINT fk_deck FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE TABLE word_sets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE set_to_card_link (
    set_id INT NOT NULL,
    card_id INT NOT NULL,
    PRIMARY KEY(set_id, card_id),

    CONSTRAINT fk_set FOREIGN KEY(set_id) REFERENCES word_sets(id) ON DELETE CASCADE,
    CONSTRAINT fk_card FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
);