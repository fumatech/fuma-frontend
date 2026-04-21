export const LOYALTY_USER_KEY = "loyaltyUser";

export const getLoyaltyUser = () => {
    const raw = localStorage.getItem(LOYALTY_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
};

export const saveLoyaltyAuth = (payload) => {
    if (!payload?.userId) return;
    localStorage.setItem(
        LOYALTY_USER_KEY,
        JSON.stringify({
            userId: payload.userId,
            email: payload.email,
            firstname: payload.firstname,
            lastname: payload.lastname,
            referralCode: payload.referralCode,
        })
    );
};

export const clearLoyaltyAuth = () => {
    localStorage.removeItem(LOYALTY_USER_KEY);
};

export const isLoyaltyLoggedIn = () => Boolean(getLoyaltyUser()?.userId);
