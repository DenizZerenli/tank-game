export class Storage {
    static HIGH_SCORE_KEY = 'tank_game_highscore';
    static POINTS_KEY = 'tank_game_points';
    static SKINS_KEY = 'tank_game_skins';
    static SELECTED_SKIN_KEY = 'tank_game_selected_skin';

    static saveHighScore(score) {
        const currentHighScore = this.getHighScore();
        if (score > currentHighScore) {
            localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
            return true;
        }
        return false;
    }

    static getHighScore() {
        return parseInt(localStorage.getItem(this.HIGH_SCORE_KEY)) || 0;
    }

    static addPoints(points) {
        const currentPoints = this.getPoints();
        localStorage.setItem(this.POINTS_KEY, (currentPoints + points).toString());
    }

    static getPoints() {
        return parseInt(localStorage.getItem(this.POINTS_KEY)) || 0;
    }

    static spendPoints(amount) {
        const currentPoints = this.getPoints();
        if (currentPoints >= amount) {
            localStorage.setItem(this.POINTS_KEY, (currentPoints - amount).toString());
            return true;
        }
        return false;
    }

    static getPurchasedSkins() {
        const skins = localStorage.getItem(this.SKINS_KEY);
        return skins ? JSON.parse(skins) : ['std'];
    }

    static purchaseSkin(skinId) {
        const skins = this.getPurchasedSkins();
        if (!skins.includes(skinId)) {
            skins.push(skinId);
            localStorage.setItem(this.SKINS_KEY, JSON.stringify(skins));
        }
    }

    static setSelectedSkin(skinId) {
        localStorage.setItem(this.SELECTED_SKIN_KEY, skinId);
    }

    static getSelectedSkin() {
        return localStorage.getItem(this.SELECTED_SKIN_KEY) || 'std';
    }
}
