//go:build integration

package testutils

import (
	"context"
	"fmt"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	migratepostgres "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/stretchr/testify/require"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// migrationsDir возвращает абсолютный путь к директории с миграциями,
// вычисленный относительно этого файла (не зависит от рабочей директории теста).
func migrationsDir() string {
	_, thisFile, _, _ := runtime.Caller(0)
	// testdb.go → testutils/ → internal/ → backend/ → db/migrations
	return "file://" + filepath.Join(filepath.Dir(thisFile), "..", "..", "db", "migrations")
}

// SetupTestDB запускает контейнер PostgreSQL, применяет миграции и возвращает gorm.DB.
// Вызов t.Cleanup автоматически останавливает контейнер после теста.
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	ctx := context.Background()

	container, err := tcpostgres.Run(ctx,
		"postgres:17-alpine",
		tcpostgres.WithDatabase("testdb"),
		tcpostgres.WithUsername("testuser"),
		tcpostgres.WithPassword("testpass"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(60*time.Second),
		),
	)
	require.NoError(t, err)

	t.Cleanup(func() {
		if err := container.Terminate(ctx); err != nil {
			t.Logf("failed to terminate container: %v", err)
		}
	})

	connStr, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)

	db, err := gorm.Open(postgres.Open(connStr), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	sqlDB, err := db.DB()
	require.NoError(t, err)

	driver, err := migratepostgres.WithInstance(sqlDB, &migratepostgres.Config{})
	require.NoError(t, err)

	m, err := migrate.NewWithDatabaseInstance(migrationsDir(), "postgres", driver)
	require.NoError(t, err)

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		require.NoError(t, err, "failed to apply migrations")
	}

	return db
}

// WithTx запускает тест внутри транзакции и откатывает её после завершения.
// Это обеспечивает изоляцию между тестами без необходимости чистить БД.
func WithTx(t *testing.T, db *gorm.DB, fn func(tx *gorm.DB)) {
	t.Helper()
	tx := db.Begin()
	require.NoError(t, tx.Error)
	defer tx.Rollback()
	fn(tx)
}

// DSN возвращает строку подключения в стандартном формате postgres.
func DSN(host string, port int) string {
	return fmt.Sprintf(
		"host=%s port=%d user=testuser password=testpass dbname=testdb sslmode=disable",
		host, port,
	)
}
