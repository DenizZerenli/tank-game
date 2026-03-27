export class Trajectory {
    static calculate(startX, startY, velocityX, velocityY, gravity, steps = 30) {
        const points = [];
        const dt = 0.1; // Delta time step for calculation
        
        let currX = startX;
        let currY = startY;
        let currVX = velocityX;
        let currVY = velocityY;

        for (let i = 0; i < steps; i++) {
            points.push({ x: currX, y: currY });
            
            // Matter.js uses a simplified physics model, but we can approximate it.
            // For a projectile, the velocity change is due to gravity.
            currVY += gravity * dt;
            currX += currVX * dt;
            currY += currVY * dt;

            // Optional: Stop if it hits a hypothetical ground
            if (currY > 720) break;
        }

        return points;
    }
}
