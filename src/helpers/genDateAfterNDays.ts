export default function genDateAfterNDays(maxAgeInDays: number) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + maxAgeInDays);
    return expirationDate;
};
