package services

import (
	"github.com/stellar/go/keypair"
	"fmt"
	"net/http"
)

type StellarAccount struct {
	PublicKey  string `json:"publicKey"`
	SecretKey  string `json:"secretKey"`
}

// CreateStellarAccount generates a new Stellar keypair
func CreateStellarAccount() (*StellarAccount, error) {
	// Generate a random keypair
	pair, err := keypair.Random()
	if err != nil {
		return nil, err
	}

	return &StellarAccount{
		PublicKey:  pair.Address(),
		SecretKey:  pair.Seed(),
	}, nil
}

// FundTestnetAccount funds a new account on testnet using Friendbot
func FundTestnetAccount(publicKey string) error {
	// For production, remove this function and handle funding differently
	resp, err := http.Get("https://friendbot.stellar.org/?addr=" + publicKey)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("failed to fund account: %d", resp.StatusCode)
	}

	return nil
} 