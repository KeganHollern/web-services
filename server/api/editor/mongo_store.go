package editor

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	collectionName    = "editor_documents"
	ttlExpireSeconds  = 86400 // 24 hours
	defaultCtxTimeout = 5 * time.Second
)

type editorDocument struct {
	ID        string    `bson:"_id"`
	Data      []byte    `bson:"data"`
	UpdatedAt time.Time `bson:"updated_at"`
}

// MongoStore implements EditorStore backed by MongoDB.
type MongoStore struct {
	col *mongo.Collection
}

// NewMongoStore creates a MongoStore and ensures the TTL index exists on updated_at.
func NewMongoStore(db *mongo.Database) (*MongoStore, error) {
	col := db.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), defaultCtxTimeout)
	defer cancel()

	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "updated_at", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(ttlExpireSeconds),
	}
	if _, err := col.Indexes().CreateOne(ctx, indexModel); err != nil {
		return nil, err
	}

	return &MongoStore{col: col}, nil
}

func (s *MongoStore) Save(ctx context.Context, documentID string, data []byte) error {
	ctx, cancel := context.WithTimeout(ctx, defaultCtxTimeout)
	defer cancel()

	doc := editorDocument{
		ID:        documentID,
		Data:      data,
		UpdatedAt: time.Now(),
	}

	filter := bson.D{{Key: "_id", Value: documentID}}
	opts := options.Replace().SetUpsert(true)
	_, err := s.col.ReplaceOne(ctx, filter, doc, opts)
	return err
}

func (s *MongoStore) Load(ctx context.Context, documentID string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, defaultCtxTimeout)
	defer cancel()

	var doc editorDocument
	err := s.col.FindOne(ctx, bson.D{{Key: "_id", Value: documentID}}).Decode(&doc)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return doc.Data, nil
}
