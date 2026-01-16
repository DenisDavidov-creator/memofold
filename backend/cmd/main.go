package main

import (
	userHandler "dimplom_harmonic/internal/auth/handler"
	userRepo "dimplom_harmonic/internal/auth/repository"
	userService "dimplom_harmonic/internal/auth/service"
	"dimplom_harmonic/internal/workers"

	deckHandler "dimplom_harmonic/internal/deck/handler"
	deckRepo "dimplom_harmonic/internal/deck/repository"
	deckService "dimplom_harmonic/internal/deck/service"

	cardHandler "dimplom_harmonic/internal/card/handler"
	cardRepo "dimplom_harmonic/internal/card/repository"
	cardService "dimplom_harmonic/internal/card/service"

	wordSetHandler "dimplom_harmonic/internal/wordSet/handler"
	wordSetRepo "dimplom_harmonic/internal/wordSet/repository"
	wordSetService "dimplom_harmonic/internal/wordSet/service"

	scheduleHandler "dimplom_harmonic/internal/schedule/handler"
	scheduleRepo "dimplom_harmonic/internal/schedule/repository"
	scheduleService "dimplom_harmonic/internal/schedule/service"

	"dimplom_harmonic/internal/middleware"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chiMD "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUser, dbPassword, dbName)

	jwtKeyString := os.Getenv("JWT_SECRET_KEY")
	if jwtKeyString == "" {
		log.Fatal("JWT_KEY_STRING must be set")
	}
	jwtKey := []byte(jwtKeyString)

	httpServer := os.Getenv("HTTP_SERVER")
	if httpServer == "" {
		httpServer = "8080"
	}

	db := ConnectToDB(dsn)
	log.Println("We are connected to DB")

	ScheduleRepository := scheduleRepo.NewScheduleRepository(db)
	UserRepository := userRepo.NewUserRepository(db)
	DeckRepository := deckRepo.NewDeckRepository(db)
	CardRepository := cardRepo.NewCardRepository(db)
	WordSetRepository := wordSetRepo.NewWordSetRepository(db)

	UserService := userService.NewUserService(UserRepository, WordSetRepository, ScheduleRepository, DeckRepository, CardRepository, jwtKey, db)
	WordSetService := wordSetService.NewWordSetService(WordSetRepository, CardRepository, db)
	DeckService := deckService.NewDeckService(DeckRepository, ScheduleRepository, CardRepository, UserRepository, WordSetRepository, db)
	CardService := cardService.NewCardService(CardRepository, WordSetRepository, db)
	ScheduleService := scheduleService.NewScheduleService(ScheduleRepository, db)

	CardHandler := cardHandler.NewCardHandler(CardService)
	DeckHandler := deckHandler.NewDeckHandler(DeckService)
	WordSetHandler := wordSetHandler.NewWordSetHandler(WordSetService)
	UserHandler := userHandler.NewUserHandler(UserService)
	ScheduleHandler := scheduleHandler.NewScheduleHandler(ScheduleService)

	authMiddleware := middleware.NewAuthMiddleware(jwtKey)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		// MUST be exact match (no *)
		AllowedOrigins: []string{"http://localhost:5173"},

		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},

		// MUST include "Set-Cookie" if you want to see it? (Actually not strictly required for credentials, but good practice)
		// Authorization is required for Bearer token
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders: []string{"Link"},
		// CRITICAL for cookies:
		AllowCredentials: true,

		MaxAge: 300,
	}))

	r.Use(chiMD.Logger)
	// CORS middleware должен быть подключен до этого

	// ГРУППА /api
	r.Route("/api", func(r chi.Router) {

		r.Post("/register", UserHandler.HandlerRegisterUser)
		r.Post("/login", UserHandler.HandlerLoginUser)
		r.Post("/auth/refresh", UserHandler.Refresh)
		r.Post("/logout", UserHandler.HDLogoutUser)

		r.Group(func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/profile", UserHandler.HandlerGetProfile)
			r.Post("/payment/mock", UserHandler.HDMockPayment)

			r.Post("/decks", DeckHandler.HDCreateDeck)
			r.Get("/decks", DeckHandler.HDGetDecks)
			r.Get("/decks/{deckID}", DeckHandler.HDGetDeckByID)
			r.Post("/decks/{deckID}/review", DeckHandler.HDReview)
			r.Put("/decks/{deckID}", DeckHandler.HDUpdateDeck)
			r.Delete("/decks/{deckID}", DeckHandler.HDDeleteDeck)
			r.Delete("/decks/{deckID}/histories", DeckHandler.HDRestart)

			r.Post("/cards", CardHandler.HDCreateCard)
			r.Delete("/cards/{cardID}", CardHandler.HDDeleteCard)
			r.Put("/cards/{cardID}", CardHandler.HDUpdateCard)
			r.Post("/cards/hard", CardHandler.HDCreateHardCards)

			r.Post("/word-sets", WordSetHandler.HDCreateWordSet)
			r.Get("/word-sets", WordSetHandler.HDGetAllWordSet)
			r.Get("/word-sets/{wordSetID}", WordSetHandler.HDGetWordSetById)
			r.Put("/word-sets/{wordSetID}", WordSetHandler.HDUpdateWordSet)
			r.Delete("/word-sets/{wordSetID}", WordSetHandler.HDDeleteWordSet)
			r.Post("/word-sets/{wordSetID}/copy", WordSetHandler.HDCopyWordSet)
			r.Post("/word-sets/{wordSetID}/cards/batch", WordSetHandler.HDCreateBatchCards)

			r.Post("/schedules", ScheduleHandler.HDCreateSchedule)
			r.Get("/schedules", ScheduleHandler.HDGetAllSchedules)
			r.Delete("/schedules/{scheduleID}", ScheduleHandler.HDDeleteSchedule)
			r.Put("/schedules/{scheduleID}", ScheduleHandler.HDUpdateSchedule)
		})
	})

	cleaner := workers.NewCleaner(db)
	cleaner.StartClean()

	log.Println("Starting server on :" + httpServer)
	if err := http.ListenAndServe(":"+httpServer, r); err != nil {
		log.Fatalf("could not start server %v", err)
	}
}

func ConnectToDB(dsn string) *gorm.DB {

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("We don't connect to DB, %v", err)
	}

	return db
}
