package main

import (
	"testing"

	proxypkg "sskycn/proxy"
)

func TestApplyModeConfigPathDefault(t *testing.T) {
	cfg := proxypkg.DefaultConfig()
	applyModeConfigPathDefault(&cfg, false, "client.json")
	if cfg.ConfigPath != "client.json" {
		t.Fatalf("config path = %q, want client.json", cfg.ConfigPath)
	}

	cfg = proxypkg.DefaultConfig()
	cfg.ConfigPath = "/tmp/custom.json"
	applyModeConfigPathDefault(&cfg, false, "server.json")
	if cfg.ConfigPath != "/tmp/custom.json" {
		t.Fatalf("custom config path = %q", cfg.ConfigPath)
	}

	cfg = proxypkg.DefaultConfig()
	cfg.ConfigPath = ""
	applyModeConfigPathDefault(&cfg, false, "server.json")
	if cfg.ConfigPath != "" {
		t.Fatalf("disabled config path = %q", cfg.ConfigPath)
	}

	cfg = proxypkg.DefaultConfig()
	applyModeConfigPathDefault(&cfg, true, "server.json")
	if cfg.ConfigPath != "config.json" {
		t.Fatalf("explicit default config path = %q", cfg.ConfigPath)
	}
}

func TestTrackedStringValueSet(t *testing.T) {
	value := "config.json"
	set := false
	flagValue := trackedStringValue{value: &value, set: &set}
	if err := flagValue.Set("client.json"); err != nil {
		t.Fatal(err)
	}
	if value != "client.json" {
		t.Fatalf("value = %q", value)
	}
	if !set {
		t.Fatal("set marker is false")
	}
}
