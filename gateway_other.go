//go:build !linux && !darwin && !windows

package proxy

import "net"

func discoverDefaultGateway() (net.IP, error) {
	return nil, errGatewayNotFound
}
