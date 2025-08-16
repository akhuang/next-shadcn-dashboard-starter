#!/bin/bash

# Deploy script for self-hosted analytics
# Usage: ./scripts/deploy-analytics.sh [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DOCKER_DIR="scripts/docker"
ACTION=""

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  -u, --up         Start analytics services"
    echo "  -d, --down       Stop analytics services"
    echo "  -r, --restart    Restart analytics services"
    echo "  -l, --logs       View analytics logs"
    echo "  -s, --status     Check analytics status"
    echo "  -c, --clean      Clean analytics data (WARNING: Deletes all data)"
    echo "  -i, --init       Initialize Plausible (create admin user)"
    echo ""
    echo "Examples:"
    echo "  $0 --up          # Start analytics services"
    echo "  $0 --init        # Initialize with admin user"
    echo "  $0 --logs        # View logs"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--up)
            ACTION="up"
            shift
            ;;
        -d|--down)
            ACTION="down"
            shift
            ;;
        -r|--restart)
            ACTION="restart"
            shift
            ;;
        -l|--logs)
            ACTION="logs"
            shift
            ;;
        -s|--status)
            ACTION="status"
            shift
            ;;
        -c|--clean)
            ACTION="clean"
            shift
            ;;
        -i|--init)
            ACTION="init"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check if action is specified
if [ -z "$ACTION" ]; then
    echo -e "${RED}No action specified${NC}"
    show_help
    exit 1
fi

# Change to docker directory
cd "$DOCKER_DIR"

# Execute action
case $ACTION in
    up)
        echo -e "${GREEN}Starting analytics services...${NC}"
        docker compose -f docker-compose.analytics.yml up -d
        echo -e "${GREEN}Analytics services started!${NC}"
        echo ""
        echo "Access Plausible Analytics at:"
        echo "  - Direct: http://localhost:8000"
        echo "  - Via proxy: https://localhost:8444/analytics"
        echo ""
        echo "Default admin credentials (change these!):"
        echo "  Email: admin@example.com"
        echo "  Password: changeme123"
        ;;
    
    down)
        echo -e "${YELLOW}Stopping analytics services...${NC}"
        docker compose -f docker-compose.analytics.yml down
        echo -e "${GREEN}Analytics services stopped${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}Restarting analytics services...${NC}"
        docker compose -f docker-compose.analytics.yml restart
        echo -e "${GREEN}Analytics services restarted${NC}"
        ;;
    
    logs)
        echo -e "${GREEN}Showing analytics logs...${NC}"
        docker compose -f docker-compose.analytics.yml logs -f
        ;;
    
    status)
        echo -e "${GREEN}Analytics services status:${NC}"
        docker compose -f docker-compose.analytics.yml ps
        ;;
    
    clean)
        echo -e "${RED}WARNING: This will delete all analytics data!${NC}"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Cleaning analytics data...${NC}"
            docker compose -f docker-compose.analytics.yml down -v
            echo -e "${GREEN}Analytics data cleaned${NC}"
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        ;;
    
    init)
        echo -e "${GREEN}Initializing Plausible Analytics...${NC}"
        
        # Start services
        docker compose -f docker-compose.analytics.yml up -d
        
        # Wait for services to be ready
        echo "Waiting for services to be ready..."
        sleep 15
        
        # Create admin user
        echo "Creating admin user..."
        docker compose -f docker-compose.analytics.yml exec plausible sh -c \
            "bin/plausible eval 'Plausible.Auth.User.new(%{email: \"admin@example.com\", password: \"changeme123\", password_confirmation: \"changeme123\"}) |> Plausible.Repo.insert!()'" || true
        
        echo -e "${GREEN}Initialization complete!${NC}"
        echo ""
        echo "Access Plausible at: http://localhost:8000"
        echo "Login with: admin@example.com / changeme123"
        echo ""
        echo -e "${YELLOW}IMPORTANT: Change the default password immediately!${NC}"
        ;;
    
    *)
        echo -e "${RED}Invalid action: $ACTION${NC}"
        exit 1
        ;;
esac
