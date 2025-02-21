class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.context = this.canvas.getContext('2d');
        this.obstacles = [];
        this.projectiles = [];
        this.playerTank = null;
        this.computerTank = null;
        this.playerScore = 0;
        this.computerScore = 0;
        this.pressedKeys = {};
        this.lastSpacePressed = false;
        this.aiDirectionTimer = 0;
        this.aiShootTimer = 0;
        
        // Define obstacle types
        this.obstacleTypes = [
            { path: 'characters/obstacle_1.png', width: 50, height: 50 },
            { path: 'characters/obstacle_2.png', width: 50, height: 50 },
            { path: 'characters/obstacle_3.png', width: 50, height: 50 }
        ];
    }

    init() {
        // Boundary obstacles (invisible walls)
        this.obstacles.push(new Obstacle(new Vector(-10, -10), 820, 10)); // Top
        this.obstacles.push(new Obstacle(new Vector(-10, 600), 820, 10)); // Bottom
        this.obstacles.push(new Obstacle(new Vector(-10, -10), 10, 620)); // Left
        this.obstacles.push(new Obstacle(new Vector(800, -10), 10, 620)); // Right

        // Create a grid for obstacle placement
        const gridSize = 60; // Size of each grid cell
        const gridCols = Math.floor((this.canvas.width - 100) / gridSize); // Leave some margin
        const gridRows = Math.floor((this.canvas.height - 100) / gridSize);
        const numObstacles = 15; // Number of obstacles to place

        // Create obstacles in random positions on the grid
        for (let i = 0; i < numObstacles; i++) {
            let obstacle;
            let attempts = 10;
            do {
                // Choose random grid position
                const gridX = Math.floor(Math.random() * gridCols);
                const gridY = Math.floor(Math.random() * gridRows);
                const x = gridX * gridSize + 50; // Add margin
                const y = gridY * gridSize + 50;

                // Choose random obstacle type
                const obstacleType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
                
                obstacle = new Obstacle(
                    new Vector(x, y),
                    obstacleType.width,
                    obstacleType.height,
                    obstacleType.path
                );
                attempts--;
            } while (this.checkObstacleCollision(obstacle) && attempts > 0);
            
            if (attempts > 0) {
                this.obstacles.push(obstacle);
            }
        }

        // Create tanks at safe positions
        this.playerTank = this.createTank(true); // Blue player tank
        this.computerTank = this.createTank(false); // Red computer tank

        // Event listeners for player input
        window.addEventListener('keydown', (e) => {
            this.pressedKeys[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.pressedKeys[e.key] = false;
        });

        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.gameLoop());
    }

    createTank(isPlayer) {
        let tank;
        do {
            let x = Math.random() * this.canvas.width;
            let y = Math.random() * this.canvas.height;
            const imagePath = isPlayer ? 'characters/yellow.png' : 'characters/blue.png';
            tank = new Tank(new Vector(x, y), Math.random() * 2 * Math.PI, imagePath, isPlayer);
        } while (this.checkTankCollision(tank));
        return tank;
    }

    checkObstacleCollision(newObstacle) {
        for (let obstacle of this.obstacles) {
            if (this.rectanglesIntersect(newObstacle.position, newObstacle.width, newObstacle.height,
                                         obstacle.position, obstacle.width, obstacle.height)) {
                return true;
            }
        }
        return false;
    }

    checkTankCollision(tank) {
        let circle = tank.getCollisionCircle();
        for (let obstacle of this.obstacles) {
            if (obstacle.intersectsCircle(circle.center, circle.radius)) {
                return true;
            }
        }
        return false;
    }

    rectanglesIntersect(pos1, w1, h1, pos2, w2, h2) {
        return !(pos1.x > pos2.x + w2 || pos1.x + w1 < pos2.x || pos1.y > pos2.y + h2 || pos1.y + h1 < pos2.y);
    }

    gameLoop() {
        let currentTime = performance.now();
        let deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        this.update(deltaTime);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Player tank controls
        if (this.pressedKeys['ArrowUp']) {
            this.playerTank.linearSpeed = this.playerTank.maxSpeed;
        } else if (this.pressedKeys['ArrowDown']) {
            this.playerTank.linearSpeed = -this.playerTank.maxSpeed;
        } else {
            this.playerTank.linearSpeed = 0;
        }
        if (this.pressedKeys['ArrowLeft']) {
            this.playerTank.angularSpeed = -this.playerTank.rotationSpeed;
        } else if (this.pressedKeys['ArrowRight']) {
            this.playerTank.angularSpeed = this.playerTank.rotationSpeed;
        } else {
            this.playerTank.angularSpeed = 0;
        }
        if (this.pressedKeys[' '] && !this.lastSpacePressed && this.playerTank.cooldown <= 0) {
            let projectile = this.playerTank.shoot();
            if (projectile) this.projectiles.push(projectile);
        }
        this.lastSpacePressed = this.pressedKeys[' '];

        // Computer tank AI (simple random behavior)
        this.aiDirectionTimer -= deltaTime;
        if (this.aiDirectionTimer <= 0) {
            this.computerTank.angularSpeed = (Math.random() * 2 - 1) * this.computerTank.rotationSpeed;
            this.computerTank.linearSpeed = (Math.random() * 2 - 1) * this.computerTank.maxSpeed;
            this.aiDirectionTimer = Math.random() * 2 + 1; // Change direction every 1-3 seconds
        }
        this.aiShootTimer -= deltaTime;
        if (this.aiShootTimer <= 0) {
            let projectile = this.computerTank.shoot();
            if (projectile) this.projectiles.push(projectile);
            this.aiShootTimer = Math.random() * 2 + 1; // Shoot every 1-3 seconds
        }

        // Update tanks
        [this.playerTank, this.computerTank].forEach(tank => {
            if (!tank.isDestroyed) {
                let direction = new Vector(Math.cos(tank.angle), Math.sin(tank.angle));
                let velocity = direction.multiply(tank.linearSpeed);
                let newPosition = tank.position.add(velocity.multiply(deltaTime));
                let circle = { center: newPosition, radius: tank.size / 2 };
                let collides = this.obstacles.some(obstacle => obstacle.intersectsCircle(circle.center, circle.radius));
                if (!collides) {
                    tank.position = newPosition;
                }
                tank.angle += tank.angularSpeed * deltaTime;
                if (tank.cooldown > 0) {
                    tank.cooldown -= deltaTime;
                    if (tank.cooldown < 0) tank.cooldown = 0;
                }
            } else {
                tank.respawnTimer -= deltaTime;
                if (tank.respawnTimer <= 0) {
                    do {
                        tank.position = new Vector(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
                    } while (this.checkTankCollision(tank));
                    tank.isDestroyed = false;
                    tank.respawnTimer = 0;
                }
            }
        });

        // Update projectiles
        this.projectiles.forEach(projectile => projectile.update(deltaTime));

        // Collision detection
        let newProjectiles = [];
        this.projectiles.forEach(projectile => {
            let hit = false;
            [this.playerTank, this.computerTank].forEach(tank => {
                if (tank !== projectile.owner && !tank.isDestroyed) {
                    let circle = tank.getCollisionCircle();
                    let dx = projectile.position.x - circle.center.x;
                    let dy = projectile.position.y - circle.center.y;
                    if (dx * dx + dy * dy < circle.radius * circle.radius) {
                        hit = true;
                        if (projectile.owner === this.playerTank) {
                            this.playerScore++;
                        } else {
                            this.computerScore++;
                        }
                        tank.isDestroyed = true;
                        tank.respawnTimer = tank.maxRespawnTime;
                    }
                }
            });
            if (!hit) {
                for (let obstacle of this.obstacles) {
                    if (obstacle.contains(projectile.position)) {
                        hit = true;
                        break;
                    }
                }
            }
            if (!hit) newProjectiles.push(projectile);
        });
        this.projectiles = newProjectiles;
    }

    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.image && obstacle.image.complete) {
                // Draw image obstacle
                this.context.drawImage(
                    obstacle.image,
                    obstacle.position.x,
                    obstacle.position.y,
                    obstacle.width,
                    obstacle.height
                );
            } else {
                // Draw boundary walls (invisible)
                if (obstacle.position.x < 0 || obstacle.position.y < 0) {
                    return; // Skip rendering boundary walls
                }
                // Fallback to rectangle for any obstacles without images
                this.context.fillStyle = 'gray';
                this.context.fillRect(
                    obstacle.position.x,
                    obstacle.position.y,
                    obstacle.width,
                    obstacle.height
                );
            }
        });

        // Draw tanks
        [this.playerTank, this.computerTank].forEach(tank => {
            if (!tank.isDestroyed && tank.image.complete) {
                this.context.save();
                this.context.translate(tank.position.x, tank.position.y);
                this.context.rotate(tank.angle);
                this.context.drawImage(
                    tank.image,
                    -tank.size / 2,
                    -tank.size / 2,
                    tank.size,
                    tank.size
                );
                this.context.restore();
            }
        });

        // Draw projectiles
        this.context.fillStyle = 'black';
        this.projectiles.forEach(projectile => {
            this.context.beginPath();
            this.context.arc(projectile.position.x, projectile.position.y, 2, 0, 2 * Math.PI);
            this.context.fill();
        });

        // Draw score
        this.context.fillStyle = 'black';
        this.context.font = '20px Arial';
        this.context.fillText(`Player: ${this.playerScore}  Computer: ${this.computerScore}`, 10, 30);
    }
}
