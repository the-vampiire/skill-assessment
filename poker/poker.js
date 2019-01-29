const faceCardMap = {
  T: 10, // ten
  J: 11, // Jack
  Q: 12, // Queen
  K: 13, // King
  A: 14, // Ace
}

const reverseFaceCardMap = {
  10: 'T',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

const Result = {
  win: 1,
  loss: 2,
  tie: 3,
};

class PokerHand {
  constructor(hand) {
    this._hand = hand.split(' ');
    this.handStatus = {};
    this.winConditions = { highCard: this._getHighCard() };

    this._initialize();
  }

  _getStatuses(hand, status) {
    return {
      theyHave: hand.handStatus[status],
      weHave: this.handStatus[status],
    };
  }

  _getHighest(hand, winCondition) {
    return {
      theirHighest: hand.winConditions[winCondition],
      ourHighest: this.winConditions[winCondition],
    };
  }

  _declareWin() { return Result.win; }
  _declareLoss() { return Result.loss; }
  _declareTie() { return Result.tie; }

  _compareCondition(hand, { status, winCondition, tieBreaker }) {
    const { theyHave, weHave } = this._getStatuses(hand, status);

    if (theyHave) {
      if (weHave) {
        // custom tie breaker method
        if (tieBreaker) return tieBreaker(hand);
  
        // default tie breaker approach
        const { theirHighest, ourHighest } = this._getHighest(hand, winCondition);
        if (theirHighest === ourHighest) return this._declareTie();
        return theirHighest > ourHighest ? this._declareLoss() : this._declareWin();
      };
      return this._declareLoss();
    }

    if (weHave) return this._declareWin();
    return null; // neither has straight flush
  }

  compareWith(hand) {
    const comparisons = [
     { status: 'hasStraightFlush', winCondition: 'highCard' },
     { status: 'hasFourOfAKind', winCondition: 'fourOfAKind' },
     { status: 'hasFullHouse', winCondition: 'threeOfAKind' },
     { status: 'hasFlush', winCondition: 'highCard' },
     { status: 'hasStraight', winCondition: 'highCard' },
     { status: 'hasThreeOfAKind', winCondition: 'threeOfAKind' },
    //  { status: 'hasTwoPair', tieBreaker: this._twoPairTieBreaker },
    //  { status: 'hasPair', tieBreaker: this._pairTieBreaker },
    ];

    for(const comparisonRules of comparisons) {
      const result = this._compareCondition(hand, comparisonRules);
      if (result !== null) return result;
    }

    // return this._compareHighCards(hand);
  }

  _initialize() {
    this._checkFlush();
    this._checkStraight();
    this._checkStraightFlush();
    // if a straight flush is found exit early
    if (this.handStatus.hasStraightFlush) return;
    
    this._checkFourOfAKind();
    // if four of a kind found exit early
    if (this.handStatus.hasFourOfAKind) return;

    // if three and pair: full house implicitly flagged
    this._checkThreeOfAKind();
    this._checkPair();
  
    // only test two pair if no full house is found
    if (!this.handStatus.hasFullHouse) this._checkTwoPair();
  }

  _checkFlush() {
    const suitToCheck = this._hand[0][1];
    const hasFlush = this._hand.every(([value, suit]) => suit === suitToCheck);
    if (hasFlush) {
      this.handStatus.hasFlush = true;
      this.winConditions.flush = suitToCheck;
    }
  }

  _checkStraight() {
    // get card values
    const values = this._hand.map(([rawValue]) => {
      const value = faceCardMap[rawValue] || rawValue;
      return Number(value);
    });

    values.sort((valA, valB) => valA - valB);
    let lastValue = values[0];
    for(const value of values.slice(1)) {
      const nextExpectedValue = lastValue + 1;
      if (value !== nextExpectedValue) return;
      lastValue = value;
    }
    this.handStatus.hasStraight = true;
    this.winConditions.straight = values;
  }

  _checkStraightFlush() {
    if (this.handStatus.hasFlush && this.handStatus.hasStraight) {
      this.handStatus.hasStraightFlush = true;
    }
  }

  _checkFourOfAKind() {
    const { card, count } = this._countDuplicates(this._hand);
    if (count === 4) {
      this.handStatus.hasFourOfAKind = true;
      this.winConditions.fourOfAKind = card;
    }
  }

  _checkThreeOfAKind() {
    const { card, count } = this._countDuplicates(this._hand);
    if (count === 3) {
      this.handStatus.hasThreeOfAKind = true;
      this.winConditions.threeOfAKind = card;
    }
  }

  _checkPair() {
    // if three of a kind has already been found
    // filter card set to find potential pair
    const hasThreeOfAKind = this.handStatus.hasThreeOfAKind;
    const cards = hasThreeOfAKind
      ? this._hand.filter(([value]) => {
        return value !== this.winConditions.threeOfAKind;
      })
      : this._hand;

    const { card, count } = this._countDuplicates(cards);
    if (count === 2) {
      this.handStatus.hasPair = true;
      this.winConditions.pair = card;
      // if a pair and three of a kind are found flag Full House
      if (hasThreeOfAKind) {
        this.handStatus.hasFullHouse = true;
        this.winConditions.fullHouse = {
          pair: card,
          three: this.winConditions.threeOfAKind,
        }
      }
    }
  }

  _checkTwoPair() {
    // if a previous pair has not been found exit early
    if (!this.handStatus.hasPair) return;

    const currentPair = this.winConditions.pair;

    const pairRemoved = this._hand.filter(([rawValue]) => {
      const value = faceCardMap[rawValue] || rawValue;
      return value !== currentPair;
    });

    const { card, count } = this._countDuplicates(pairRemoved);
    if (count === 2) {
      this.handStatus.hasTwoPair = true;
      this.winConditions.twoPair = [currentPair, card];
    }
  }

  _getHighCard() {
    return this._hand.reduce(
      (highCard, [value]) => {
        const cardValue = faceCardMap[value] || Number(value);
        return cardValue > highCard ? cardValue : highCard;
      },
      '0',
    );
  }

  _countDuplicates(cards) {
    const highestFrequency = (cardFrequency) => {
      let entries = Object.entries(cardFrequency);
      // sort by frequency descending
      entries.sort((entryA, entryB) => entryB[1] - entryA[1]);
      const [card, count] = entries[0];
      return { card: reverseFaceCardMap[card] || card, count };
    }

    return cards.reduce(
      (cardFrequency, [rawValue], index, hand) => {
        const value = faceCardMap[rawValue] || rawValue;

        if (cardFrequency[value]) ++cardFrequency[value];
        else cardFrequency[value] = 1;

        // on last iteration reduce frequencies to highest count only
        if (index === hand.length - 1) return highestFrequency(cardFrequency);
        return cardFrequency;
      },
      {},
    ); 
  }
}

module.exports = PokerHand;