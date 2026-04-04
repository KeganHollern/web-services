package secret

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	collectionName     = "secrets"
	ttlExpireSeconds   = 86400 // 24 hours
	defaultCtxTimeout  = 5 * time.Second
)

type secretDocument struct {
	ID        string    `bson:"_id"`
	Content   string    `bson:"content"`
	CreatedAt time.Time `bson:"created_at"`
}

// MongoStore implements SecretStore backed by MongoDB.
type MongoStore struct {
	col *mongo.Collection
}

// NewMongoStore creates a MongoStore and ensures the TTL index exists on created_at.
func NewMongoStore(db *mongo.Database) (*MongoStore, error) {
	col := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), defaultCtxTimeout)
	defer cancel()

	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "created_at", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(ttlExpireSeconds),
	}
	if _, err := col.Indexes().CreateOne(ctx, indexModel); err != nil {
		return nil, err
	}

	return &MongoStore{col: col}, nil
}

func (s *MongoStore) Create(content string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), defaultCtxTimeout)
	defer cancel()

	doc := secretDocument{
		ID:        uuid.NewString(),
		Content:   content,
		CreatedAt: time.Now(),
	}

	if _, err := s.col.InsertOne(ctx, doc); err != nil {
		return "", err
	}
	return doc.ID, nil
}

func (s *MongoStore) GetAndDelete(id string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), defaultCtxTimeout)
	defer cancel()

	var doc secretDocument
	err := s.col.FindOneAndDelete(ctx, bson.D{{Key: "_id", Value: id}}).Decode(&doc)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return "", ErrNotFound
		}
		return "", err
	}
	return doc.Content, nil
}
