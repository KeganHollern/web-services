package db

import (
	"context"
	"errors"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// Connect establishes a connection to MongoDB using MONGO_URI and MONGO_DB
// environment variables. Returns the database handle or an error.
func Connect() (*mongo.Database, error) {
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		return nil, errors.New("MONGO_URI environment variable is not set")
	}

	dbName := os.Getenv("MONGO_DB")
	if dbName == "" {
		return nil, errors.New("MONGO_DB environment variable is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	return client.Database(dbName), nil
}
