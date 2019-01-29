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

function PokerHand(hand) {
  this._hand = hand.split(' ');
  this.handStatus = {};
  
  this.getHighCard = function(hand) {
    const cards = hand || this._hand;
    return cards.reduce(
      (highCard, [value]) => {
        const cardValue = faceCardMap[value] || Number(value);
        return cardValue > highCard ? cardValue : highCard;
      },
      '0');
  }
  
  this.winConditions = { highCard: this.getHighCard() };
  
  this._getStatuses = function(hand, status) {
    return {
      theyHave: hand.handStatus[status],
      weHave: this.handStatus[status],
    };
  }

  this._getHighestWinCondition = function(hand, winCondition) {
    return {
      theirHighest: hand.winConditions[winCondition],
      ourHighest: this.winConditions[winCondition],
    };
  }

  this._declareWin = function() { return Result.win; }
  this._declareLoss = function() { return Result.loss; }
  this._declareTie = function() { return Result.tie; }

  this._compareCondition = function(hand, { status, winCondition, tieBreaker }) {
    const { theyHave, weHave } = this._getStatuses(hand, status);

    if (theyHave) {
      if (weHave) {
        // custom tie breaker method
        // anonymous tieBreaker passed as arg is unbound: use call
        if (tieBreaker) return tieBreaker.call(this, hand);
  
        // default tie breaker approach
        const { theirHighest, ourHighest } = this._getHighestWinCondition(hand, winCondition);
        if (theirHighest === ourHighest) return this._declareTie();
        return theirHighest > ourHighest ? this._declareLoss() : this._declareWin();
      };
      return this._declareLoss();
    }

    if (weHave) return this._declareWin();
    return null;
  }

  this.assessHand = function() {
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

  this._checkFlush = function() {
    const suitToCheck = this._hand[0][1];
    const hasFlush = this._hand.every(([value, suit]) => suit === suitToCheck);
    if (hasFlush) {
      this.handStatus.hasFlush = true;
      this.winConditions.flush = suitToCheck;
    }
  }

  this._checkStraight = function() {
    // get card values
    const values = this._hand.map(([rawValue]) => {
      const value = faceCardMap[rawValue] || rawValue;
      return Number(value);
    });

    values.sort((valA, valB) => valA - valB);
    // sort straight in order ascending
    let lastValue = values[0];
    for(const value of values.slice(1)) {
      const nextExpectedValue = lastValue + 1;
      if (value !== nextExpectedValue) return;
      lastValue = value;
    }
    this.handStatus.hasStraight = true;
    this.winConditions.straight = values;
  }

  this._checkStraightFlush = function() {
    if (this.handStatus.hasFlush && this.handStatus.hasStraight) {
      this.handStatus.hasStraightFlush = true;
    }
  }
  
  this._countDuplicates = function(cards) {
    const highestFrequency = (cardFrequency) => {
      const entries = Object.keys(cardFrequency).map(key => [key, cardFrequency[key]]);
      // sort by frequency descending
      entries.sort((entryA, entryB) => entryB[1] - entryA[1]);
      const [card, count] = entries[0];
      return { card: Number(card), count };
    }

    return cards.reduce((cardFrequency, [rawValue], index, hand) => {
        const value = faceCardMap[rawValue] || Number(rawValue);

        if (cardFrequency[value]) ++cardFrequency[value];
        else cardFrequency[value] = 1;

        // on last iteration reduce frequencies to highest count only
        if (index === hand.length - 1) return highestFrequency(cardFrequency);
        return cardFrequency;
      },
      {}); 
  }

  this._checkFourOfAKind = function() {
    const { card, count } = this._countDuplicates(this._hand);
    if (count === 4) {
      this.handStatus.hasFourOfAKind = true;
      this.winConditions.fourOfAKind = card;
    }
  }

  this._checkThreeOfAKind = function() {
    const { card, count } = this._countDuplicates(this._hand);
    if (count === 3) {
      this.handStatus.hasThreeOfAKind = true;
      this.winConditions.threeOfAKind = card;
    }
  }

  this._checkPair = function() {
    // if three of a kind has already been found
    // filter card set to find potential pair
    const hasThreeOfAKind = this.handStatus.hasThreeOfAKind;
    const cards = hasThreeOfAKind
      ? this._hand.filter(([rawValue]) => {
          const value = faceCardMap[rawValue] || rawValue;
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

  this._checkTwoPair = function() {
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
      const pairs = [currentPair, card];
      // sort in desc order for tiebreaking
      pairs.sort((cardA, cardB) => cardB - cardA);
      this.winConditions.twoPair = pairs;
    }
  }

  this._pairTieBreaker = function(hand) {
    const { theirHighest, ourHighest } = this._getHighestWinCondition(hand, 'pair');

    // compare pair
    if (theirHighest > ourHighest) return this._declareLoss();
    if (theirHighest < ourHighest) return this._declareWin();
    
    return null;
  }

  this._twoPairTieBreaker = function(hand) {
    const { theirHighest, ourHighest } = this._getHighestWinCondition(hand, 'twoPair');
    const [theirFirst, theirSecond] = theirHighest;
    const [ourFirst, ourSecond] = ourHighest;

    // compare highest pairs
    if (theirFirst > ourFirst) return this._declareLoss();
    if (theirFirst < ourFirst) return this._declareWin();
    
    if (theirFirst === ourFirst) {
      // tie on highest pairs compare second highest pairs
      if (theirSecond > ourSecond) return this._declareLoss();
      if (theirSecond < ourSecond) return this._declareWin();
    }

    return null;
  }

  this._compareHighCards = function(hand) {
    const filterHighCard = (cards, highCard) => {
      const cardsClone = cards.slice();
      const highCardIndex = cardsClone.findIndex(([rawValue]) => {
        const value = faceCardMap[rawValue] || Number(rawValue);
        return value === highCard;
      });
      if (highCardIndex === -1) return cards;
      cardsClone.splice(highCardIndex, 1);
      return cardsClone;
    };

    const recursiveCompare = (theirCards, ourCards) => {
      // no more cards to compare: complete tie
      if (theirCards.length === 0 && ourCards.length === 0) return null;

      const theirHighest = hand.getHighCard(theirCards);
      const ourHighest = this.getHighCard(ourCards);

      // their highest beats ours: we lose
      if (theirHighest > ourHighest) return false;
      // our highest beats theirs: we win
      if (theirHighest < ourHighest) return true;

      // remove the last highest card checked and recurse
      const theirRemaining = filterHighCard(theirCards, theirHighest);
      const ourRemaining = filterHighCard(ourCards, ourHighest);

      return recursiveCompare(theirRemaining, ourRemaining);
    }

    const result = recursiveCompare(hand._hand, this._hand);
  
    if (result === true) return this._declareWin();
    if (result === false) return this._declareLoss();
    return this._declareTie();
  } 
}

PokerHand.prototype.compareWith = function(hand) {
  // assess the results of each hand
  this.assessHand();
  hand.assessHand();

  const comparisons = [
    { status: 'hasStraightFlush', winCondition: 'highCard' },
    { status: 'hasFourOfAKind', winCondition: 'fourOfAKind' },
    { status: 'hasFullHouse', winCondition: 'threeOfAKind' },
    { status: 'hasFlush', winCondition: 'highCard' },
    { status: 'hasStraight', winCondition: 'highCard' },
    { status: 'hasThreeOfAKind', winCondition: 'threeOfAKind' },
    { status: 'hasTwoPair', tieBreaker: this._twoPairTieBreaker },
    { status: 'hasPair', tieBreaker: this._pairTieBreaker },
  ];

  for(const comparisonRules of comparisons) {
    const result = this._compareCondition(hand, comparisonRules);
    if (result !== null) return result;
  }

  return this._compareHighCards(hand);
}

module.exports = PokerHand;