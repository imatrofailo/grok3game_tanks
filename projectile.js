class Projectile {
    constructor(position, velocity, owner) {
        this.position = position;
        this.velocity = velocity;
        this.owner = owner;
    }

    update(deltaTime) {
        this.position = this.position.add(this.velocity.multiply(deltaTime));
    }
}
