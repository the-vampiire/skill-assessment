const PokerHand = require('./poker');

test('getHighCard', () => {
  const p1 = new PokerHand("AC 2C 5D JS 3C");
  const highCard = p1.getHighCard();
  expect(highCard.card).toBe("AC");
  expect(highCard.value).toBe(14);
});

test('highest straight flush wins', () => {
  const p1 = new PokerHand("2H 3H 4H 5H 6H");
  const p2 = new PokerHand("KS AS TS QS JS");
  const result = p1.compareWith(p2);
  expect(result).toBe(2);
});

test('highest 4 of a kind', () => {
  const p1 = new PokerHand("AS AH 2H AD AC");
  const p2 = new PokerHand("JS JD JC JH 3D");
  const result = p1.compareWith(p2);
  expect(result).toBe(1);
});

test('full house wins over flush', () => {
  const p1 = new PokerHand("2S AH 2H AS AC");
  const p2 = new PokerHand("2H 3H 5H 6H 7H");
  const result = p1.compareWith(p2);
  expect(result).toBe(1);
});

test('highest pair wins', () => {
  const p1 = new PokerHand("6S AD 7H 4S AS");
  const p2 = new PokerHand("AH AC 5H 6H 7S");
  const result = p1.compareWith(p2);
  expect(result).toBe(2);
});
