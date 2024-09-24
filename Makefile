AWS_REGION=us-east-1
AWS_PROFILE=default
AWS_SHARED_CREDENTIALS_FILE=../../.aws/credentials
AWS_CONFIG_FILE=../../.aws/config
AWS_SDK_LOAD_CONFIG=1
REPOSITORY_NAME=code-blog
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
ENV := dev

# Database-related variables
DB_PORT ?= 5433
DB_PASSWORD ?= WeAreAllKin!
DB_NAME ?= postgres
DB_USER ?= codeblog
DOCKER_NETWORK = code-network

version=

.PHONY: ecr-uri
ecr-uri:
	$(eval ECR_REPOSITORY := $(shell AWS_SHARED_CREDENTIALS_FILE=$(AWS_SHARED_CREDENTIALS_FILE) AWS_CONFIG_FILE=$(AWS_CONFIG_FILE) aws ecr describe-repositories --repository-names $(REPOSITORY_NAME) --region $(AWS_REGION) --profile $(AWS_PROFILE) --query 'repositories[0].repositoryUri' --output text))

.PHONY: build
build: gen-frontend
	docker build --progress=plain --platform linux/amd64 -t $(REPOSITORY_NAME):latest -f ./docker/Dockerfile .

.PHONY: ensure-network
ensure-network:
	@docker network inspect $(DOCKER_NETWORK) >/dev/null 2>&1 || \
		(echo "Creating Docker network $(DOCKER_NETWORK)" && \
		docker network create $(DOCKER_NETWORK))

.PHONY: free-port
free-port:
	@echo "Checking if port $(DB_PORT) is in use..."
	@lsof -i :$(DB_PORT) >/dev/null 2>&1 && ( \
		echo "Port $(DB_PORT) is in use. Attempting to free it..."; \
		lsof -i :$(DB_PORT) -t | xargs kill -9; \
		echo "Port $(DB_PORT) has been freed."; \
	) || echo "Port $(DB_PORT) is available."

.PHONY: stop-db
stop-db:
	@echo "Stopping and removing all PostgreSQL containers..."
	-docker stop $$(docker ps -a -q --filter ancestor=postgres) 2>/dev/null
	-docker rm $$(docker ps -a -q --filter ancestor=postgres) 2>/dev/null

.PHONY: start-db
start-db: ensure-network stop-db free-port
	@echo "Starting PostgreSQL container"
	@docker run --name postgres-db --network $(DOCKER_NETWORK) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_DB=$(DB_NAME) \
		-p $(DB_PORT):5432 \
		-d postgres

	@echo "Waiting for PostgreSQL to start..."
	@sleep 5
	@if ! docker ps | grep -q postgres-db; then \
		echo "Error: PostgreSQL container failed to start."; \
		echo "Please check Docker logs with: docker logs postgres-db"; \
		exit 1; \
	fi
	@echo "PostgreSQL container started successfully on port $(DB_PORT)."

.PHONY: init-db
init-db:
	@echo "Initializing database..."
	@docker run --rm --network $(DOCKER_NETWORK) \
		-e DATABASE_URL="postgresql://$(DB_USER):$(DB_PASSWORD)@postgres-db:5432/$(DB_NAME)" \
		$(REPOSITORY_NAME):latest \
		/bin/sh -c "cd /app/packages/database && \
		bun run prisma migrate deploy && \
		bun run db:seed"

.PHONY: run-local
run-local:
	@echo "Stopping and removing existing application container if it exists"
	-docker stop $(REPOSITORY_NAME)-local
	-docker rm $(REPOSITORY_NAME)-local
	@echo "Running the application container"
	docker run -p 8080:3000 --rm --name $(REPOSITORY_NAME)-local --network $(DOCKER_NETWORK) \
		-e DATABASE_URL="postgresql://$(DB_USER):$(DB_PASSWORD)@postgres-db:5432/$(DB_NAME)" \
		$(REPOSITORY_NAME):latest

# Add a new target for full setup and run
.PHONY: full-run-local
full-run-local: clear-docker-cache build start-db init-db run-local

.PHONY: login-ecr
login-ecr: ecr-uri
	@AWS_SHARED_CREDENTIALS_FILE=$(AWS_SHARED_CREDENTIALS_FILE) AWS_CONFIG_FILE=$(AWS_CONFIG_FILE) aws ecr get-login-password --region $(AWS_REGION) --profile $(AWS_PROFILE) | \
	docker login --username AWS --password-stdin $(ECR_REPOSITORY)

.PHONY: tag-push-image
tag-push-image: ecr-uri
	@if [ -z "$(version)" ]; then \
		echo "\n\nError: version is not set. Please provide a version number.\n"; \
		echo "Example:"; \
		echo "\tmake deploy version=v0.0.1\n\n"; \
		exit 1; \
	fi
	@echo "\nDeploying version $(version) to $(ECR_REPOSITORY)\n"
	docker tag $(REPOSITORY_NAME):latest $(ECR_REPOSITORY):$(version)
	docker push $(ECR_REPOSITORY):$(version)
	@echo "\nCompleted deploy of $(version) to $(ECR_REPOSITORY)\n"

.PHONY: run-remote
run-remote: ecr-uri
	@if [ -z "$(version)" ]; then \
		echo "Error: version is not set. Please provide a version number."; \
		exit 1; \
	fi
	docker pull $(ECR_REPOSITORY):$(version)
	docker run -p 8080:3000 --rm --name $(REPOSITORY_NAME)-local $(ECR_REPOSITORY):$(version)

.PHONY: deploy
deploy: build
	cddc deploy --service-config ./service.yaml -p code$(ENV) -t latest

.PHONY: dev
dev:
	@echo "Starting development environment"
	cd packages/backend && npm run dev

.PHONY: gen-api
gen-api:
	cd packages/api && npm run gen

.PHONY: gen-db
gen-db:
	cd packages/database && npm run db:format
	cd packages/database && npm run db:init

.PHONY: gen-frontend
gen-frontend:
	cd packages/frontend && npm run build

.PHONY: gen
gen: gen-api gen-db gen-frontend

.PHONY: migrate
migrate:
	cd packages/database && npm run db:migrate

.PHONY: install
install:
	@echo "Installing dependencies"
	cd packages/api && npm install
	cd packages/api && npm run gen
	cd packages/database && npm install
	cd packages/frontend && npm install
	cd packages/frontend && npm run build
	cd packages/backend && npm install

	@echo "Setting up database"

	@if [ ! -f packages/backend/.env ]; then \
		echo "\nError: packages/backend/.env file not found. Please create one using the template provided in packages/backend/.env.example"; \
		echo "\nExample:"; \
		echo "\tcp ./packages/backend/example.env ./packages/backend/.env\n\n"; \
		exit 1; \
	fi

	$(MAKE) start-db
	$(MAKE) init-db

.PHONY: verifier-key
verifier-key:
	@echo "Generating verifier key"
	cd packages/backend && npm run script:gen-secret

.PHONY: clear-docker-cache
clear-docker-cache:
	@echo "Clearing Docker cache"
	docker system prune -af
	docker volume prune -f
	docker network prune -f

.PHONY: redeploy-local
redeploy-local:
	@echo "Clearing Docker cache"
	$(MAKE) clear-docker-cache
	@sleep 5
	@echo "Building Docker image"
	$(MAKE) build
	@sleep 5
	@echo "Running the application container locally"
	$(MAKE) run-local

.PHONY: db-test
db-test:
	clear
	npx ts-node -r dotenv/config packages/database/prisma/test.ts