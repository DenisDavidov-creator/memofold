package workers

import (
	"log"
	"time"

	"gorm.io/gorm"
)

type Cleaner struct {
	db *gorm.DB
}

func NewCleaner(db *gorm.DB) *Cleaner {
	return &Cleaner{db: db}
}

func (c *Cleaner) StartClean() {
	tiker := time.NewTicker(1 * time.Minute)

	go func() {
		for {
			<-tiker.C
			c.CleanOrphance()
		}
	}()
}

func (c *Cleaner) CleanOrphance() {
	batchSize := 100

	for {

		var maxId int
		c.db.Raw("SELECT COALESCE(max(id), 0) FROM cards").Scan(&maxId)
		safeThreshold := maxId - 100

		query := `
			DELETE FROM cards 
			WHERE id IN (
				SELECT id FROM cards 
				WHERE id < ? 
				AND NOT EXISTS (SELECT 1 FROM deck_cards WHERE deck_cards.card_id = cards.id)
				AND NOT EXISTS (SELECT 1 FROM set_to_card_link WHERE set_to_card_link.card_id = cards.id)
				LIMIT ?
			)
		`
		result := c.db.Exec(query, safeThreshold, batchSize)

		if result.Error != nil {
			log.Printf("Clean up error: %v", result.Error)
			break
		}

		deletedCount := result.RowsAffected
		if deletedCount == 0 {
			log.Println("Orphaned card cleanup completed")
			break
		}

		log.Printf("Successfully deleted %d orphaned cards", deletedCount)

		time.Sleep(200 * time.Millisecond)
	}
}
