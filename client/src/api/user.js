import client from './client';

export const getUser = () => client.get('/user').then(r => r.data);
export const redeemCoupon = () => client.post('/user/redeem-coupon').then(r => r.data);
