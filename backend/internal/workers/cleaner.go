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
	tiker := time.NewTicker(1 * time.Hour)

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
		query := `DELETE FROM cards 
				  WHERE id NOT IN (SELECT card_id FROM deck_cards)	
				  AND id NOT IN (SELECT card_id FROM set_to_card_link
				  LIMIT ?
				)
		`

		result := c.db.Exec(query, batchSize)

		if result.Error != nil {
			log.Printf("Clean up error: %v", result.Error)
		}

		deletedCount := result.RowsAffected

		if deletedCount == 0 {
			log.Println("Deleted Orphance card is completed")
			break
		}
		log.Println("Was deleted", deletedCount, "cards")

		time.Sleep(100 * time.Millisecond)
	}
}
