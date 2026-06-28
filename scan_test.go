package main

import (
	"net"
	"testing"
)

func TestForEachIPv4HostSkipsNetworkAndBroadcast(t *testing.T) {
	_, network, err := net.ParseCIDR("192.168.1.0/30")
	if err != nil {
		t.Fatal(err)
	}

	var hosts []string
	forEachIPv4Host(network, func(ip net.IP) bool {
		hosts = append(hosts, ip.String())
		return true
	})

	if got, want := len(hosts), 2; got != want {
		t.Fatalf("host count = %d, want %d (%v)", got, want, hosts)
	}
	if hosts[0] != "192.168.1.1" || hosts[1] != "192.168.1.2" {
		t.Fatalf("hosts = %v", hosts)
	}
}

func TestIPv4Uint32RoundTrip(t *testing.T) {
	ip := net.ParseIP("10.20.30.40")
	value := ipv4ToUint32(ip)
	if got, want := uint32ToIPv4(value).String(), "10.20.30.40"; got != want {
		t.Fatalf("round trip = %s, want %s", got, want)
	}
}

func TestIPv4AddrNetwork(t *testing.T) {
	addr := &net.IPNet{
		IP:   net.ParseIP("192.168.31.42"),
		Mask: net.CIDRMask(24, 32),
	}

	ip, network, ok := ipv4AddrNetwork(addr)
	if !ok {
		t.Fatal("expected IPv4 network")
	}
	if got, want := ip.String(), "192.168.31.42"; got != want {
		t.Fatalf("ip = %s, want %s", got, want)
	}
	if got, want := network.String(), "192.168.31.0/24"; got != want {
		t.Fatalf("network = %s, want %s", got, want)
	}
}

func TestIsUsefulIPv4Network(t *testing.T) {
	_, useful, err := net.ParseCIDR("192.168.1.0/24")
	if err != nil {
		t.Fatal(err)
	}
	_, pointToPoint, err := net.ParseCIDR("192.168.1.0/31")
	if err != nil {
		t.Fatal(err)
	}

	if !isUsefulIPv4Network(useful) {
		t.Fatal("/24 should be useful")
	}
	if isUsefulIPv4Network(pointToPoint) {
		t.Fatal("/31 should not be scanned")
	}
}
