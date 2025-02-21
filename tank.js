class Tank {
    constructor(position, angle, imagePath, isPlayer) {
        this.position = position;
        this.angle = angle;
        this.linearSpeed = 0;
        this.angularSpeed = 0;
        this.size = 30; // Tank size
        this.isPlayer = isPlayer;
        this.cooldown = 0;
        this.maxCooldown = 1; // 1 second shooting cooldown
        this.isDestroyed = false;
        this.respawnTimer = 0;
        this.maxRespawnTime = 3; // 3 seconds to respawn
        this.maxSpeed = 100; // Pixels per second
        this.rotationSpeed = 2; // Radians per second
        
        // Load tank image
        this.image = new Image();
        this.image.src = imagePath;
    }

    shoot() {
        if (this.cooldown <= 0 && !this.isDestroyed) {
            let direction = new Vector(Math.cos(this.angle), Math.sin(this.angle));
            let projectileSpeed = 200; // Pixels per second
            let velocity = direction.multiply(projectileSpeed);
            let projectile = new Projectile(new Vector(this.position.x, this.position.y), velocity, this);
            this.cooldown = this.maxCooldown;
            return projectile;
        }
        return null;
    }

    getCollisionCircle() {
        return { center: this.position, radius: this.size / 2 };
    }
}
