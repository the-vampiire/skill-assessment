const PokerHand = require('./poker');

// test('returns the high card', () => {
//   const hand = "4S 5H 6H TS AC";
//   const pokerHand = new PokerHand(hand);
//   expect(pokerHand.handStatus.highCard).toBe('AC');
// });

// test('countDuplicates() method', () => {
//   const hand = "AS AH AC 3D AC";
//   const pokerHand = new PokerHand(hand);
//   const highestFrequency = pokerHand._countDuplicates(pokerHand._hand);
//   expect(highestFrequency.card).toBe('A');
// });

// test('has 4 of a kind', () => {
//   const hand = "4S 4H 4C 4D AC";
//   const pokerHand = new PokerHand(hand);
//   expect(pokerHand.handStatus.hasFourOfAKind).toBe(true);
//   expect(pokerHand.winConditions.fourOfAKind).toBe("4");
// });

// test('has 3 of a kind', () => {
//   const hand = "4S 4H 4C AD AC";
//   const pokerHand = new PokerHand(hand);
//   expect(pokerHand.handStatus.hasThreeOfAKind).toBe(true);
//   expect(pokerHand.winConditions.threeOfAKind).toBe("4");
// });

// test('has pair', () => {
//   const hand = "4S 4H 5C 5D 5S";
//   const pokerHand = new PokerHand(hand);
//   expect(pokerHand.handStatus.hasPair).toBe(true);
//   expect(pokerHand.winConditions.pair).toBe("4");
// });

test('straight flush', () => {
  const p1 = new PokerHand("2H 3H 4H 5H 6H");
  const p2 = new PokerHand("KS AS TS QS JS");
  const result = p1.compareWith(p2);
  expect(result).toBeDefined();
});