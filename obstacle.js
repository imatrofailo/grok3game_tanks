class Obstacle {
    constructor(position, width, height, imagePath = null) {
        this.position = position; // Top-left corner
        this.width = width;
        this.height = height;
        
        if (imagePath) {
            this.image = new Image();
            this.image.src = imagePath;
        }
    }

    contains(point) {
        return point.x >= this.position.x && point.x <= this.position.x + this.width &&
               point.y >= this.position.y && point.y <= this.position.y + this.height;
    }

    intersectsCircle(center, radius) {
        let closestX = Math.max(this.position.x, Math.min(center.x, this.position.x + this.width));
        let closestY = Math.max(this.position.y, Math.min(center.y, this.position.y + this.height));
        let dx = center.x - closestX;
        let dy = center.y - closestY;
        return (dx * dx + dy * dy) < (radius * radius);
    }
}
